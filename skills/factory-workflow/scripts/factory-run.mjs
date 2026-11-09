#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STAGES = new Set(["planning", "ready", "building", "reviewing", "shipping",
  "waiting_ci", "ready_for_human", "paused", "blocked", "completed", "cancelled"]);
const CI = new Set(["unknown", "pending", "passed", "failed", "not_configured", "unavailable"]);
const VERDICTS = new Set([null, "pass", "changes_requested", "blocked"]);
const EDITABLE = new Set(["stage", "round", "repair_count", "max_repair_rounds",
  "repair_limit_note", "comparison_base_sha", "candidate_sha", "reviewed_sha",
  "review_verdict", "latest_build", "latest_review", "latest_ship", "pr_url",
  "publication_authorized", "publication_note", "ci_status", "ci_exception_note",
  "blocked_reason", "active_worker", "merge_sha"]);
const SHA = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/;
const digest = (text) => crypto.createHash("sha256").update(text).digest("hex");
const fail = (message) => { throw new Error(message); };

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

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

function requireValue(value, name) {
  if (typeof value !== "string" || !value.trim()) fail(`Missing ${name}`);
  return value;
}

function atomicJson(destination, value) {
  const temporary = `${destination}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    fs.renameSync(temporary, destination);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function loadRun(run) {
  const directory = fs.realpathSync(path.resolve(requireValue(run, "--run")));
  const status = JSON.parse(fs.readFileSync(path.join(directory, "status.json"), "utf8"));
  if (status.schema_version !== 1 || !Number.isSafeInteger(status.revision)) fail("Unsupported run status");
  return { directory, status };
}

function validate(next, directory, previous) {
  if (!STAGES.has(next.stage)) fail("Invalid stage");
  if (!CI.has(next.ci_status) || !VERDICTS.has(next.review_verdict)) fail("Invalid CI state or review verdict");
  for (const key of ["round", "repair_count", "max_repair_rounds"]) {
    if (!Number.isSafeInteger(next[key]) || next[key] < (key === "round" ? 1 : 0)) fail(`Invalid ${key}`);
  }
  if (next.round !== next.repair_count + 1) fail("round must equal repair_count + 1");
  if (next.repair_count < previous.repair_count) fail("Repair counters cannot be reset");
  if (next.repair_count > next.max_repair_rounds) fail("Automatic repair limit exhausted");
  if (next.max_repair_rounds > previous.max_repair_rounds && !next.repair_limit_note?.trim()) {
    fail("Record explicit user authorization before extending the repair limit");
  }
  for (const key of ["initial_base_sha", "comparison_base_sha", "candidate_sha", "reviewed_sha", "merge_sha"]) {
    if ((key.endsWith("base_sha") || next[key] !== null) && !SHA.test(next[key] ?? "")) fail(`Invalid full SHA: ${key}`);
  }
  for (const key of ["repair_limit_note", "publication_note", "ci_exception_note", "blocked_reason", "active_worker"]) {
    if (next[key] !== null && typeof next[key] !== "string") fail(`Invalid text field: ${key}`);
  }
  if (typeof next.publication_authorized !== "boolean") fail("Invalid publication_authorized");
  if (next.publication_authorized && !next.publication_note?.trim()) fail("Publication authority needs a user instruction note");
  if (next.pr_url !== null) {
    let url;
    try { url = new URL(next.pr_url); } catch { fail("Invalid PR URL"); }
    if (url.protocol !== "https:" || url.username || url.password) fail("PR URL must be HTTPS without credentials");
  }
  for (const key of ["latest_build", "latest_review", "latest_ship"]) {
    const name = next[key];
    if (name === null) continue;
    if (typeof name !== "string" || path.isAbsolute(name) || name.split(/[\\/]/).includes("..")) fail(`Invalid handoff path: ${key}`);
    const resolved = fs.realpathSync(path.join(directory, name));
    if (!resolved.startsWith(`${directory}${path.sep}`) || !fs.statSync(resolved).isFile()) fail(`Handoff must be a file inside this run: ${key}`);
  }
  const approved = next.approved_task_sha256 && next.approval_note;
  if (!["planning", "paused", "blocked", "cancelled"].includes(next.stage)) {
    if (!approved || next.approved_task_sha256 !== digest(fs.readFileSync(path.join(directory, "task.md")))) {
      fail("Current task needs explicit recorded approval");
    }
  }
  if (next.candidate_sha !== previous.candidate_sha || next.comparison_base_sha !== previous.comparison_base_sha) {
    if (next.reviewed_sha !== null || next.review_verdict !== null || next.ci_status !== "unknown") {
      fail("Changed candidate/base must clear review fields and reset CI to unknown");
    }
  }
  if (["shipping", "waiting_ci", "ready_for_human"].includes(next.stage)) {
    if (!next.candidate_sha || next.review_verdict !== "pass" || next.reviewed_sha !== next.candidate_sha || !next.latest_review) {
      fail("Shipping requires a passing review of this exact candidate");
    }
    if (git(next.worktree_path, "rev-parse", "HEAD") !== next.candidate_sha || git(next.worktree_path, "status", "--porcelain")) {
      fail("Worktree must be clean at the reviewed candidate");
    }
  }
  if (next.stage === "ready_for_human") {
    if (!next.pr_url || !next.publication_authorized || !next.latest_ship) fail("Ready state requires publication authority, PR, and shipping handoff");
    const exception = ["not_configured", "unavailable"].includes(next.ci_status) && next.ci_exception_note?.trim();
    if (next.ci_status !== "passed" && !exception) fail("Required CI must pass or have an explicit recorded user exception");
  }
}

function initialize(args) {
  const opts = options(args, ["--repo", "--id", "--base", "--root"]);
  const repo = fs.realpathSync(git(path.resolve(requireValue(opts.repo, "--repo")), "rev-parse", "--show-toplevel"));
  const id = requireValue(opts.id, "--id");
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) fail("Task ID must be 1-80 lowercase letters, digits, or hyphens, starting with a letter or digit");
  const base = requireValue(opts.base, "--base");
  if (base.startsWith("-")) fail("Base ref cannot start with '-'");
  const baseSha = git(repo, "rev-parse", "--verify", `${base}^{commit}`);
  let identity;
  try { identity = git(repo, "remote", "get-url", "origin"); } catch { identity = repo; }
  const short = digest(identity).slice(0, 10);
  const label = path.basename(repo).toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 40) || "repo";
  const repoKey = `${label}-${short}`;
  const root = path.resolve(opts.root || path.join(os.homedir(), ".pior-factory-runs"));
  const directory = path.join(root, repoKey, id);
  const relative = path.relative(repo, root);
  if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
    fail("Run root must be outside the target repository");
  }
  fs.mkdirSync(path.dirname(directory), { recursive: true, mode: 0o700 });
  fs.mkdirSync(directory, { mode: 0o700 }); // Exclusive: never overwrite an existing run.
  fs.mkdirSync(path.join(directory, "evidence"), { mode: 0o700 });
  fs.copyFileSync(path.join(SKILL, "assets", "task.md"), path.join(directory, "task.md"), fs.constants.COPYFILE_EXCL);
  const status = {
    schema_version: 1, revision: 0, run_id: id, repo_key: repoKey, repo_path: repo,
    base_ref: base, initial_base_sha: baseSha, comparison_base_sha: baseSha,
    worktree_path: path.join(root, ".worktrees", repoKey, id),
    branch: `factory/${id}-${short}`, stage: "planning", round: 1,
    repair_count: 0, max_repair_rounds: 3, repair_limit_note: null,
    approved_task_sha256: null, approval_note: null,
    candidate_sha: null, reviewed_sha: null, review_verdict: null,
    latest_build: null, latest_review: null, latest_ship: null,
    pr_url: null, publication_authorized: false, publication_note: null,
    ci_status: "unknown", ci_exception_note: null,
    blocked_reason: null, active_worker: null, merge_sha: null,
    updated_at: new Date().toISOString(),
  };
  atomicJson(path.join(directory, "status.json"), status);
  process.stdout.write(`${JSON.stringify({ run_dir: directory, ...status }, null, 2)}\n`);
}

function mutate(command, args) {
  const opts = options(args, ["--run", "--expected-revision", command === "approve" ? "--note" : "--patch"]);
  const { directory } = loadRun(opts.run);
  const revision = Number(requireValue(opts["expected-revision"], "--expected-revision"));
  if (!Number.isSafeInteger(revision) || revision < 0) fail("Invalid expected revision");
  const lock = path.join(directory, ".status.lock");
  try { fs.mkdirSync(lock); } catch (error) {
    if (error.code === "EEXIST") fail("Status is locked; inspect the live writer before removing a stale .status.lock");
    throw error;
  }
  try {
    const { status } = loadRun(directory);
    if (status.revision !== revision) fail(`Stale revision: expected ${revision}, actual ${status.revision}`);
    let next = { ...status };
    if (command === "approve") {
      const note = fs.readFileSync(requireValue(opts.note, "--note"), "utf8");
      if (!note.trim()) fail("Approval note is empty");
      const task = fs.readFileSync(path.join(directory, "task.md"), "utf8");
      if (/\{\{[A-Z_]+\}\}/.test(task)) fail("Fill the task template before recording approval");
      next.approved_task_sha256 = digest(task);
      next.approval_note = `approval-${status.revision + 1}.md`;
      next.stage = "ready";
      next.reviewed_sha = null;
      next.review_verdict = null;
      next.ci_status = "unknown";
      validate(next, directory, status);
      fs.writeFileSync(path.join(directory, next.approval_note), note, { flag: "wx", mode: 0o600 });
    } else {
      const patch = JSON.parse(fs.readFileSync(requireValue(opts.patch, "--patch"), "utf8"));
      if (!patch || Array.isArray(patch) || typeof patch !== "object") fail("Patch must be a JSON object");
      for (const key of Object.keys(patch)) if (!EDITABLE.has(key)) fail(`Field is not editable: ${key}`);
      next = { ...status, ...patch };
      validate(next, directory, status);
    }
    next.revision = status.revision + 1;
    next.updated_at = new Date().toISOString();
    atomicJson(path.join(directory, "status.json"), next);
    process.stdout.write(`${JSON.stringify(next, null, 2)}\n`);
  } finally {
    fs.rmdirSync(lock);
  }
}

try {
  const [command, ...args] = process.argv.slice(2);
  if ([undefined, "--help", "-h"].includes(command)) {
    console.log("factory-run: init --repo PATH --id ID --base REF [--root PATH]\n" +
      "             show --run PATH\n" +
      "             approve --run PATH --expected-revision N --note FILE\n" +
      "             update --run PATH --expected-revision N --patch FILE\n" +
      "Records only: no project edits, worktree creation, agent execution, or publication.");
  } else if (command === "init") initialize(args);
  else if (command === "show") console.log(JSON.stringify(loadRun(options(args, ["--run"]).run).status, null, 2));
  else if (["approve", "update"].includes(command)) mutate(command, args);
  else fail(`Unknown command: ${command}`);
} catch (error) {
  console.error(`factory-run: ${error.message}`);
  process.exitCode = 1;
}
