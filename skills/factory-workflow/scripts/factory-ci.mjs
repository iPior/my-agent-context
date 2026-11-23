#!/usr/bin/env node
// Waits for the GitHub check runs on one commit and saves their final states.
// The coordinator runs it in the background after shipping (see "Pace the
// run"), instead of a hand-written polling loop. It reads check runs through
// the GitHub REST API with the gh CLI, so it reports on the exact head SHA, and
// it waits until the expected number of checks exist, because a job that
// starts only after another finishes is not registered at push time.
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const SHA = /^[a-f0-9]{40}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
// Conclusions that do not fail a required check.
const PASSING = new Set(["success", "neutral", "skipped"]);
const fail = (message) => { throw new Error(message); };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function options(args, allowed) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    if (!allowed.includes(key) || Object.prototype.hasOwnProperty.call(result, key.slice(2)) || args[i + 1] === undefined) {
      fail(`Invalid, repeated, or incomplete option: ${key}`);
    }
    result[key.slice(2)] = args[i + 1];
  }
  return result;
}

function count(value, name, minimum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum) fail(`${name} must be a whole number of at least ${minimum}`);
  return number;
}

// One page of 100 is plenty for a PR's checks; more is reported, not guessed.
function checkRuns(repo, sha) {
  const output = execFileSync("gh", ["api", `repos/${repo}/commits/${sha}/check-runs?per_page=100`], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const body = JSON.parse(output);
  if (!Array.isArray(body.check_runs)) fail("Unexpected check-runs response");
  if (body.total_count > body.check_runs.length) fail(`More than ${body.check_runs.length} check runs; read them by hand`);
  return body.check_runs.map((run) => ({
    name: run.name, status: run.status, conclusion: run.conclusion, head_sha: run.head_sha, url: run.html_url,
  }));
}

function summarize(runs, expect) {
  const done = runs.filter((run) => run.status === "completed");
  if (done.some((run) => !PASSING.has(run.conclusion))) return "failed";
  if (runs.length >= expect && done.length === runs.length) return "passed";
  return "pending";
}

async function wait(args) {
  const opts = options(args, ["--repo", "--sha", "--expect", "--timeout", "--interval", "--log"]);
  if (!REPO.test(opts.repo ?? "")) fail("--repo must be OWNER/NAME");
  if (!SHA.test(opts.sha ?? "")) fail("--sha must be a full 40-character SHA");
  const expect = count(opts.expect ?? "1", "--expect", 1);
  const timeout = count(opts.timeout ?? "1800", "--timeout", 1);
  const interval = count(opts.interval ?? "30", "--interval", 1);
  // Each watch gets its own log, so earlier CI evidence is never overwritten.
  if (opts.log && fs.existsSync(opts.log)) fail(`Log already exists: ${opts.log}`);
  const deadline = Date.now() + timeout * 1000;
  let runs = [];
  let state = "pending";
  let errors = 0;
  for (;;) {
    try {
      runs = checkRuns(opts.repo, opts.sha);
      errors = 0;
      // A run whose head is another commit is stale evidence for this one.
      if (runs.some((run) => run.head_sha && run.head_sha !== opts.sha)) fail("A check run belongs to another commit");
      state = summarize(runs, expect);
    } catch (error) {
      // A transient API failure is retried; three in a row end the wait.
      if (++errors >= 3 || /another commit|More than/.test(error.message)) throw error;
    }
    if (state !== "pending" || Date.now() + interval * 1000 > deadline) break;
    await sleep(interval * 1000);
  }
  const result = {
    repo: opts.repo, sha: opts.sha, expected_checks: expect, state,
    checked_at: new Date().toISOString(), check_runs: runs,
  };
  const text = `${JSON.stringify(result, null, 2)}\n`;
  if (opts.log) fs.writeFileSync(opts.log, text, { flag: "wx", mode: 0o600 });
  process.stdout.write(text);
  // 0 passed, 1 failed (or error), 2 still pending at the timeout.
  process.exitCode = state === "passed" ? 0 : state === "failed" ? 1 : 2;
}

try {
  const [command, ...args] = process.argv.slice(2);
  if ([undefined, "--help", "-h"].includes(command)) {
    console.log("factory-ci: wait --repo OWNER/NAME --sha SHA [--expect N] [--timeout SECONDS] [--interval SECONDS] [--log FILE]\n" +
      "Exit 0 when at least N check runs exist on SHA and all passed, 1 when one failed, 2 when still pending at the timeout.\n" +
      "Read only: uses the gh CLI's existing login and never changes the PR or its checks.");
  } else if (command === "wait") await wait(args);
  else fail(`Unknown command: ${command}`);
} catch (error) {
  console.error(`factory-ci: ${error.message}`);
  process.exitCode = 1;
}
