#!/usr/bin/env node
// Start and stop the scratch servers a factory worker needs for browser
// exploration, and track them by the processes it actually started. It is a
// plain command, not a service: nothing keeps running except the servers
// themselves, and every state change is a file in the given directory.
import fs from "node:fs";
import net from "node:net";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";

const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
const fail = (message) => { throw new Error(message); };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const USAGE = `Usage:
  factory-servers.mjs start --dir <state-dir> --name <name> --port <port> --cwd <dir>
      [--ready-url <url>] [--timeout <seconds>] -- <command> [args...]
  factory-servers.mjs status --dir <state-dir>
  factory-servers.mjs stop --dir <state-dir> (--name <name> | --all) [--grace <seconds>]

--cwd is required so a server never runs in whatever directory the caller
happens to be in, such as the main checkout instead of the worktree.
Environment variables for the server are inherited: prefix them to this
command (for example E2E_WEB_PORT=5373 node factory-servers.mjs start ...).`;

function options(args, allowed, flags = []) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    const name = key.slice(2);
    if (Object.prototype.hasOwnProperty.call(result, name)) fail(`Repeated option: ${key}`);
    if (flags.includes(key)) { result[name] = true; continue; }
    if (!allowed.includes(key) || args[i + 1] === undefined) fail(`Invalid or incomplete option: ${key}`);
    result[name] = args[++i];
  }
  return result;
}

function stateDir(value) {
  if (typeof value !== "string" || !value.trim()) fail("Missing --dir");
  const directory = path.resolve(value);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  return fs.realpathSync(directory);
}

function serverName(value) {
  if (!NAME.test(value ?? "")) fail("--name must be 1 to 40 lowercase letters, digits or dashes");
  return value;
}

function workingDirectory(value) {
  if (typeof value !== "string" || !value.trim()) {
    fail("Missing --cwd: give the directory the server must run in, such as the worktree");
  }
  let directory;
  try {
    directory = fs.realpathSync(path.resolve(value));
  } catch {
    fail(`--cwd ${value} does not exist`);
  }
  if (!fs.statSync(directory).isDirectory()) fail(`--cwd ${value} is not a directory`);
  return directory;
}

// How the server's first process ended, from its exit event.
const exitDescription = (exit) => {
  if (!exit) return "";
  return exit.code !== null ? ` (exit code ${exit.code})` : ` (signal ${exit.signal})`;
};

function portNumber(value) {
  const port = Number(value);
  if (!/^\d+$/.test(value ?? "") || port < 1 || port > 65535) fail("--port must be a TCP port number");
  return port;
}

const recordFile = (directory, name) => path.join(directory, `${name}.json`);

function readRecord(directory, name) {
  try {
    return JSON.parse(fs.readFileSync(recordFile(directory, name), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function records(directory) {
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => readRecord(directory, file.slice(0, -5)))
    .filter(Boolean)
    .sort((a, b) => a.started_at.localeCompare(b.started_at));
}

// The start time of a process, used with the PID so a reused PID is never
// mistaken for the server. Works with procps (Linux) and BSD ps (macOS).
function startTime(pid) {
  try {
    return execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

function signalGroup(pgid, signal) {
  try {
    process.kill(-pgid, signal);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

// The group is checked, not only the leader: a package runner can exit while
// the server it started keeps the port.
const groupAlive = (pgid) => signalGroup(pgid, 0);

// The recorded group still belongs to this server: either its leader is the
// same process (same PID and start time), or the leader is gone and only its
// group members remain. A dead leader whose PID now names another process
// fails the start time check and is left alone.
function ownsGroup(record) {
  const current = startTime(record.pid);
  if (current !== null) return current === record.pid_start_time;
  return groupAlive(record.pgid);
}

function connects(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => { socket.destroy(); resolve(result); };
    socket.setTimeout(500, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

// Dev servers may bind IPv4 or IPv6 loopback only, so check both.
async function portBusy(port) {
  return (await connects("127.0.0.1", port)) || (await connects("::1", port));
}

function urlReady(url) {
  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const request = client.get(url, { timeout: 2000 }, (response) => {
      response.resume();
      resolve(response.statusCode < 500);
    });
    request.once("timeout", () => request.destroy());
    request.once("error", () => resolve(false));
  });
}

function logTail(file, lines = 20) {
  try {
    return fs.readFileSync(file, "utf8").trimEnd().split("\n").slice(-lines).join("\n");
  } catch {
    return "(no log output)";
  }
}

async function stopGroup(record, graceMs = 10000) {
  if (!ownsGroup(record)) return "not_running";
  signalGroup(record.pgid, "SIGTERM");
  const deadline = Date.now() + graceMs;
  while (Date.now() < deadline) {
    if (!groupAlive(record.pgid)) return "stopped";
    await sleep(100);
  }
  signalGroup(record.pgid, "SIGKILL");
  await sleep(200);
  return groupAlive(record.pgid) ? "still_running" : "killed";
}

async function start(args) {
  const split = args.indexOf("--");
  if (split === -1 || split === args.length - 1) fail("Give the server command after --");
  const command = args.slice(split + 1);
  const opts = options(args.slice(0, split), ["--dir", "--name", "--port", "--cwd", "--ready-url", "--timeout"]);
  const directory = stateDir(opts.dir);
  const name = serverName(opts.name);
  const port = portNumber(opts.port);
  const cwd = workingDirectory(opts.cwd);
  const timeout = opts.timeout === undefined ? 60 : Number(opts.timeout);
  if (!Number.isFinite(timeout) || timeout <= 0) fail("--timeout must be a positive number of seconds");
  if (opts["ready-url"] !== undefined && !/^https?:\/\//.test(opts["ready-url"])) fail("--ready-url must be an http or https URL");

  const existing = readRecord(directory, name);
  if (existing && ownsGroup(existing)) {
    fail(`Server "${name}" is already running (pid ${existing.pid}, port ${existing.port}). Stop it first.`);
  }
  // A busy port means some other process would answer the browser: refuse
  // rather than report a server ready that is not the one just started.
  if (await portBusy(port)) {
    const holder = records(directory).find((record) => record.port === port && ownsGroup(record));
    if (holder) {
      fail(`Port ${port} is already in use by server "${holder.name}" (pid ${holder.pid}) from this state directory. Stop it first.`);
    }
    fail(`Port ${port} is already in use by a process with no running record in this state directory`);
  }

  const log = path.join(directory, `${name}.log`);
  const output = fs.openSync(log, "a", 0o600);
  fs.writeSync(output, `\n--- ${new Date().toISOString()} start ${name}: ${command.join(" ")} (cwd ${cwd})\n`);
  // detached puts the server in a new process group led by the child, so
  // stop can signal everything it spawned without matching command lines.
  const child = spawn(command[0], command.slice(1), { cwd, detached: true, stdio: ["ignore", output, output] });
  fs.closeSync(output);
  const spawnError = new Promise((resolve) => child.once("error", resolve));
  // This process keeps running while it waits for readiness, so it sees how
  // the server's first process ended if it exits early.
  let exit = null;
  child.once("exit", (code, signal) => { exit = { code, signal }; });
  child.unref();
  const failed = await Promise.race([spawnError, sleep(50).then(() => null)]);
  if (failed) fail(`Could not start ${command[0]}: ${failed.message}`);

  const record = {
    name, pid: child.pid, pgid: child.pid, pid_start_time: startTime(child.pid), port, cwd, command,
    ready_url: opts["ready-url"] ?? null, log, started_at: new Date().toISOString(),
  };
  if (record.pid_start_time === null) {
    if (!groupAlive(record.pgid)) {
      if (!exit) await sleep(100);
      fail(`Server "${name}" exited before it was ready${exitDescription(exit)}. Last log lines:\n${logTail(log)}`);
    }
    // Without a start time the server could not be told apart from a reused
    // PID later, so it could never be stopped safely.
    signalGroup(record.pgid, "SIGKILL");
    fail(`Server "${name}" could not be identified with ps and was stopped. Last log lines:\n${logTail(log)}`);
  }
  fs.writeFileSync(recordFile(directory, name), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });

  const deadline = Date.now() + timeout * 1000;
  while (Date.now() < deadline) {
    if (!groupAlive(record.pgid)) {
      fs.unlinkSync(recordFile(directory, name));
      // Give the exit event a moment to arrive if the group died just now.
      if (!exit) await sleep(100);
      fail(`Server "${name}" exited before it was ready${exitDescription(exit)}. Last log lines:\n${logTail(log)}`);
    }
    if ((await portBusy(port)) && (!record.ready_url || (await urlReady(record.ready_url)))) {
      process.stdout.write(`${JSON.stringify({ ...record, state: "ready" }, null, 2)}\n`);
      return;
    }
    await sleep(250);
  }
  const stopped = await stopGroup(record);
  if (stopped !== "still_running") fs.unlinkSync(recordFile(directory, name));
  fail(`Server "${name}" was not ready within ${timeout}s and was ${stopped.replace("_", " ")}. Last log lines:\n${logTail(log)}`);
}

async function status(args) {
  const directory = stateDir(options(args, ["--dir"]).dir);
  const result = [];
  for (const record of records(directory)) {
    const running = ownsGroup(record);
    result.push({ name: record.name, pid: record.pid, port: record.port, running,
      port_in_use: await portBusy(record.port), log: record.log, started_at: record.started_at });
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function stop(args) {
  const opts = options(args, ["--dir", "--name", "--grace"], ["--all"]);
  const directory = stateDir(opts.dir);
  if (Boolean(opts.all) === (opts.name !== undefined)) fail("Give exactly one of --name or --all");
  // How long a server gets to clean up after SIGTERM before SIGKILL. A killed
  // test fixture cannot drop its database or stop its container.
  const grace = opts.grace === undefined ? 10 : Number(opts.grace);
  if (!/^\d+(?:\.\d+)?$/.test(opts.grace ?? "10") || grace <= 0) fail("--grace must be a positive number of seconds");
  let targets;
  if (opts.all) {
    targets = records(directory).reverse();
  } else {
    const record = readRecord(directory, serverName(opts.name));
    if (!record) fail(`No record of a server named "${opts.name}" in ${directory}`);
    targets = [record];
  }
  const result = [];
  let problem = false;
  for (const record of targets) {
    const outcome = await stopGroup(record, grace * 1000);
    const portInUse = await portBusy(record.port);
    if (outcome !== "still_running") fs.unlinkSync(recordFile(directory, record.name));
    if (outcome === "still_running" || portInUse) problem = true;
    result.push({ name: record.name, pid: record.pid, port: record.port, outcome, port_in_use: portInUse });
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (problem) fail("A server did not stop, or its port is still in use by another process; see the output above");
}

const [command, ...args] = process.argv.slice(2);
const commands = { start, status, stop };
if (!commands[command]) {
  process.stderr.write(`${USAGE}\n`);
  process.exit(command === "--help" || command === "-h" ? 0 : 2);
}
commands[command](args).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
