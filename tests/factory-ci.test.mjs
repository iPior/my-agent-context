import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELPER = path.join(ROOT, "skills/factory-workflow/scripts/factory-ci.mjs");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pior-factory-ci-"));
const bin = path.join(temporary, "bin");
const SHA = "a".repeat(40);
const OTHER = "b".repeat(40);
let checks = 0;

// A fake gh on PATH answers each call with the next saved response (the last
// one repeats) and records the API path it was asked for. It never contacts
// GitHub.
fs.mkdirSync(bin);
fs.writeFileSync(path.join(bin, "gh"), `#!${process.execPath}
const fs = require("node:fs");
const dir = process.env.FAKE_GH_DIR;
const calls = fs.existsSync(dir + "/calls") ? fs.readFileSync(dir + "/calls", "utf8").split("\\n").filter(Boolean) : [];
fs.appendFileSync(dir + "/calls", process.argv.slice(2).join(" ") + "\\n");
const responses = JSON.parse(fs.readFileSync(dir + "/responses.json", "utf8"));
const next = responses[Math.min(calls.length, responses.length - 1)];
if (next === "error") { process.stderr.write("HTTP 502\\n"); process.exit(1); }
process.stdout.write(JSON.stringify(next));
`, { mode: 0o755 });

const run = (name, status, conclusion, head = SHA) => ({ name, status, conclusion, head_sha: head, html_url: `https://example.test/${name}` });
const page = (...runs) => ({ total_count: runs.length, check_runs: runs });

function wait(responses, extra, expectedStatus, errorPattern) {
  const dir = fs.mkdtempSync(path.join(temporary, "case-"));
  fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
  const result = spawnSync(process.execPath, [HELPER, "wait", "--repo", "owner/app", "--sha", SHA, "--interval", "1", ...extra], {
    encoding: "utf8", timeout: 30000, env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, FAKE_GH_DIR: dir },
  });
  assert.equal(result.status, expectedStatus, result.stderr);
  if (errorPattern) assert.match(result.stderr, errorPattern);
  checks++;
  const calls = fs.existsSync(path.join(dir, "calls")) ? fs.readFileSync(path.join(dir, "calls"), "utf8").trim().split("\n") : [];
  return { output: result.stdout ? JSON.parse(result.stdout) : null, calls, dir };
}

try {
  // Waits while the second, late-starting check is not registered yet.
  const log = path.join(temporary, "ci-01.log");
  const passed = wait([
    page(run("validate", "in_progress", null)),
    page(run("validate", "completed", "success")),
    page(run("validate", "completed", "success"), run("Build release images", "completed", "success")),
  ], ["--expect", "2", "--log", log], 0);
  assert.equal(passed.output.state, "passed");
  assert.equal(passed.calls.length, 3);
  assert.equal(passed.calls[0], `api repos/owner/app/commits/${SHA}/check-runs?per_page=100`);
  assert.deepEqual(passed.output.check_runs.map((c) => c.name), ["validate", "Build release images"]);
  assert.deepEqual(JSON.parse(fs.readFileSync(log, "utf8")), passed.output);

  // A failure ends the wait at once, even before every check is registered.
  const failed = wait([page(run("validate", "completed", "failure"))], ["--expect", "2"], 1);
  assert.equal(failed.output.state, "failed");
  assert.equal(failed.calls.length, 1);

  // Skipped and neutral checks do not fail.
  assert.equal(wait([page(run("a", "completed", "skipped"), run("b", "completed", "neutral"))], [], 0).output.state, "passed");

  // Still pending at the timeout: exit 2 with the last states.
  const pending = wait([page(run("validate", "queued", null))], ["--timeout", "2"], 2);
  assert.equal(pending.output.state, "pending");

  // Transient API errors are retried; three in a row end the wait.
  assert.equal(wait(["error", page(run("validate", "completed", "success"))], [], 0).output.state, "passed");
  wait(["error"], [], 1, /HTTP 502/);

  // A check run for another commit is stale evidence.
  wait([page(run("validate", "completed", "success", OTHER))], [], 1, /another commit/);

  // Arguments are validated before gh is called, and a log is never overwritten.
  const bad = (args, pattern) => {
    const result = spawnSync(process.execPath, [HELPER, "wait", ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, pattern);
    checks++;
  };
  bad(["--repo", "owner/app", "--sha", "abc"], /full 40-character SHA/);
  bad(["--repo", "https://github.com/owner/app", "--sha", SHA], /OWNER\/NAME/);
  bad(["--repo", "owner/app", "--sha", SHA, "--expect", "0"], /at least 1/);
  const refused = wait([page(run("validate", "completed", "success"))], ["--log", log], 1, /Log already exists/);
  assert.equal(refused.calls.length, 0);
  console.log(`Passed ${checks} factory CI wait checks with a fake gh.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
