import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELPER = path.join(ROOT, "skills/factory-workflow/scripts/factory-servers.mjs");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pior-factory-servers-"));
const state = path.join(temporary, "servers");
let checks = 0;

function helper(args, errorPattern) {
  const result = spawnSync(process.execPath, [HELPER, ...args], { encoding: "utf8", timeout: 30000 });
  if (errorPattern) {
    assert.notEqual(result.status, 0, `Expected failure: ${args.join(" ")}`);
    assert.match(result.stderr, errorPattern);
  } else {
    assert.equal(result.status, 0, result.stderr);
  }
  checks++;
  return result.stdout ? JSON.parse(result.stdout) : null;
}

function freePort() {
  return new Promise((resolve) => {
    const server = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const alive = (pid) => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

// A server that, like a package runner, starts a child process which owns
// the port, and writes both PIDs to a file so the test can check them.
const fixture = path.join(temporary, "server.mjs");
fs.writeFileSync(fixture, `
import fs from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";
const [mode, port, pidFile] = process.argv.slice(2);
if (mode === "parent") {
  const child = spawn(process.execPath, [process.argv[1], "child", port, pidFile], { stdio: "inherit" });
  fs.writeFileSync(pidFile + ".parent", String(process.pid));
  child.on("exit", (code) => process.exit(code ?? 0));
} else if (mode === "child") {
  fs.writeFileSync(pidFile + ".child", String(process.pid));
  net.createServer((socket) => socket.end()).listen(Number(port), "127.0.0.1");
} else if (mode === "crash") {
  console.error("fixture failed to boot");
  process.exit(3);
} else if (mode === "silent") {
  setInterval(() => {}, 1000);
} else if (mode === "slow-exit") {
  // Takes a second to clean up after SIGTERM, like a fixture dropping a database.
  net.createServer((socket) => socket.end()).listen(Number(port), "127.0.0.1");
  process.on("SIGTERM", () => setTimeout(() => {
    fs.writeFileSync(pidFile + ".cleaned", "yes");
    process.exit(0);
  }, 1000));
}
`);

try {
  const port = await freePort();
  const pids = path.join(temporary, "pids");
  const start = (name, serverPort, mode, extra = []) => [
    "start", "--dir", state, "--name", name, "--port", String(serverPort), ...extra,
    "--", process.execPath, fixture, mode, String(serverPort), pids,
  ];

  helper(["start", "--dir", state, "--name", "Bad Name", "--port", "1", "--", "true"], /--name/);
  helper(["start", "--dir", state, "--name", "web", "--port", "99999", "--", "true"], /--port/);
  helper(["start", "--dir", state, "--name", "web", "--port", "3000"], /after --/);
  helper(["stop", "--dir", state], /exactly one/);
  helper(["stop", "--dir", state, "--name", "nothing"], /No record/);

  // Start: ready only once the grandchild listens, with the real PIDs recorded.
  const ready = helper(start("web", port, "parent"));
  assert.equal(ready.state, "ready");
  assert.equal(ready.pid, Number(fs.readFileSync(`${pids}.parent`, "utf8")));
  const childPid = Number(fs.readFileSync(`${pids}.child`, "utf8"));
  assert.ok(alive(childPid));

  // The same name, or another server on a busy port, is refused.
  helper(start("web", port, "parent"), /already running/);
  helper(start("other", port, "parent"), /already in use/);

  const [listed] = helper(["status", "--dir", state]);
  assert.deepEqual([listed.name, listed.running, listed.port_in_use], ["web", true, true]);

  // Stop signals the whole group: the grandchild holding the port is gone too.
  const [stopped] = helper(["stop", "--dir", state, "--name", "web"]);
  assert.equal(stopped.outcome, "stopped");
  assert.equal(stopped.port_in_use, false);
  assert.equal(alive(childPid), false);
  assert.deepEqual(helper(["status", "--dir", state]), []);

  // A fresh start on the same port works after a stop.
  helper(start("web", port, "parent"));

  // A record whose PID now names another process is not that server: here
  // the record is pointed at this test process, which must survive.
  const other = await freePort();
  fs.writeFileSync(path.join(state, "stale.json"), JSON.stringify({
    name: "stale", pid: process.pid, pgid: process.pid, pid_start_time: "Thu Jan  1 00:00:00 1970",
    port: other, cwd: temporary, command: ["node"], ready_url: null,
    log: path.join(state, "stale.log"), started_at: "1970-01-01T00:00:00.000Z",
  }));
  const [stale] = helper(["stop", "--dir", state, "--name", "stale"]);
  assert.equal(stale.outcome, "not_running");
  assert.ok(alive(process.pid));

  // A server that exits during startup fails with its log, leaving no record.
  helper(start("crash", await freePort(), "crash"), /exited before it was ready[\s\S]*fixture failed to boot/);
  assert.equal(fs.existsSync(path.join(state, "crash.json")), false);

  // A server that never listens is stopped at the timeout.
  helper(start("silent", await freePort(), "silent", ["--timeout", "1"]), /not ready within 1s and was stopped/);
  assert.equal(fs.existsSync(path.join(state, "silent.json")), false);

  // --grace decides whether a slow cleanup finishes or is killed.
  helper(["stop", "--dir", state, "--name", "web", "--grace", "0"], /--grace/);
  helper(["stop", "--dir", state, "--name", "web", "--grace", "soon"], /--grace/);
  const slowPort = await freePort();
  helper(start("slow", slowPort, "slow-exit"));
  const [killed] = helper(["stop", "--dir", state, "--name", "slow", "--grace", "0.3"]);
  assert.equal(killed.outcome, "killed");
  assert.equal(fs.existsSync(`${pids}.cleaned`), false);
  helper(start("slow", slowPort, "slow-exit"));
  const [graceful] = helper(["stop", "--dir", state, "--name", "slow", "--grace", "5"]);
  assert.equal(graceful.outcome, "stopped");
  assert.equal(fs.readFileSync(`${pids}.cleaned`, "utf8"), "yes");

  // stop --all stops every recorded server.
  const all = helper(["stop", "--dir", state, "--all"]);
  assert.deepEqual(all.map((item) => [item.name, item.outcome]), [["web", "stopped"]]);
  assert.equal(fs.readdirSync(state).filter((file) => file.endsWith(".json")).length, 0);

  console.log(`Passed ${checks} factory server helper checks.`);
} finally {
  spawnSync(process.execPath, [HELPER, "stop", "--dir", state, "--all"], { encoding: "utf8" });
  fs.rmSync(temporary, { recursive: true, force: true });
}
