import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HELPER = path.join(ROOT, "skills/factory-workflow/scripts/factory-run.mjs");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pior-factory-test-"));
const repo = path.join(temporary, "sample repo");
const runRoot = path.join(temporary, "local runs");
const skills = ["factory-workflow", "factory-plan", "factory-build", "factory-review", "factory-ship"];
let checks = 0;

function git(...args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function helper(args, errorPattern) {
  const result = spawnSync(process.execPath, [HELPER, ...args], { encoding: "utf8" });
  if (errorPattern) {
    assert.notEqual(result.status, 0, `Expected failure: ${args.join(" ")}`);
    assert.match(result.stderr, errorPattern);
  } else {
    assert.equal(result.status, 0, result.stderr);
  }
  checks++;
  return result.stdout;
}

try {
  fs.mkdirSync(repo);
  git("init", "-q");
  git("config", "user.name", "Factory test");
  git("config", "user.email", "factory-test@localhost");
  fs.writeFileSync(path.join(repo, "app.txt"), "baseline\n");
  git("add", "app.txt");
  git("commit", "-qm", "Baseline fixture");
  const base = git("rev-parse", "HEAD");
  const mainStatus = git("status", "--porcelain");

  helper(["init", "--repo", repo, "--id", "../escape", "--base", "HEAD", "--root", runRoot], /Task ID/);
  helper(["init", "--repo", repo, "--id", "valid", "--base", "HEAD", "--root", path.join(repo, "runs")], /outside/);
  helper(["init", "--repo", repo, "--repo", repo, "--id", "valid", "--base", "HEAD", "--root", runRoot], /repeated/);
  const initial = JSON.parse(helper(["init", "--repo", repo, "--id", "change", "--base", "HEAD", "--root", runRoot]));
  const run = initial.run_dir;
  const stateFile = path.join(run, "status.json");
  const read = () => JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.equal(initial.initial_base_sha, base);
  assert.equal(initial.stage, "planning");
  assert.equal(initial.publication_authorized, false);
  assert.equal(fs.existsSync(initial.worktree_path), false);
  assert.equal(git("status", "--porcelain"), mainStatus);
  helper(["init", "--repo", repo, "--id", "change", "--base", "HEAD", "--root", runRoot], /exist/i);
  assert.equal(read().revision, 0);

  const note = path.join(temporary, "approval.txt");
  fs.writeFileSync(note, "Fixture user approved AC-1 and this implementation plan.\n");
  helper(["approve", "--run", run, "--expected-revision", "0", "--note", note], /template/);
  fs.writeFileSync(path.join(run, "task.md"), "# Fixture task\n\nAC-1: Replace baseline with implemented.\n");
  helper(["approve", "--run", run, "--expected-revision", "0", "--note", note]);
  assert.equal(read().stage, "ready");
  assert.match(read().approved_task_sha256, /^[a-f0-9]{64}$/);
  assert.equal(fs.readFileSync(path.join(run, read().approval_note), "utf8"), fs.readFileSync(note, "utf8"));

  const patchFile = path.join(run, "update.json");
  function update(patch, errorPattern, revision = read().revision) {
    fs.writeFileSync(patchFile, JSON.stringify(patch));
    return helper(["update", "--run", run, "--expected-revision", String(revision), "--patch", patchFile], errorPattern);
  }
  update({ stage: "building" }, /Stale revision/, 0);
  assert.equal(read().revision, 1);
  update({ repo_path: "/unexpected" }, /not editable/);
  fs.mkdirSync(path.join(run, ".status.lock"));
  update({ stage: "building" }, /locked/);
  fs.rmdirSync(path.join(run, ".status.lock"));

  const approvedTask = fs.readFileSync(path.join(run, "task.md"), "utf8");
  fs.appendFileSync(path.join(run, "task.md"), "Changed requirements\n");
  update({ stage: "building" }, /approval/);
  fs.writeFileSync(path.join(run, "task.md"), approvedTask);
  fs.mkdirSync(path.dirname(initial.worktree_path), { recursive: true });
  git("worktree", "add", "-b", initial.branch, initial.worktree_path, base);
  update({ stage: "building" });
  const candidateFile = path.join(initial.worktree_path, "app.txt");
  fs.writeFileSync(candidateFile, "implemented\n");
  execFileSync("git", ["-C", initial.worktree_path, "commit", "-am", "Implement fixture"], { stdio: "pipe" });
  const candidate = execFileSync("git", ["-C", initial.worktree_path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  fs.writeFileSync(path.join(run, "build-01.md"), `Candidate: ${candidate}\nAC-1 evidence: app.txt contains implemented.\n`);
  update({ stage: "reviewing", candidate_sha: candidate, latest_build: "build-01.md" });
  update({ stage: "shipping" }, /passing review/);
  update({ latest_review: "../approval.txt" }, /Invalid handoff/);
  const outside = path.join(run, "outside.md");
  fs.symlinkSync(note, outside);
  update({ latest_review: "outside.md" }, /inside this run/);
  fs.writeFileSync(path.join(run, "review-01.md"), `Reviewed: ${candidate}\nVerdict: pass\n`);
  update({ reviewed_sha: candidate, review_verdict: "pass", latest_review: "review-01.md", stage: "shipping" });
  fs.writeFileSync(candidateFile, "unreviewed\n");
  update({ stage: "waiting_ci" }, /clean/);
  fs.writeFileSync(candidateFile, "implemented\n");
  update({ publication_authorized: true }, /authority/);
  update({ candidate_sha: base }, /clear review/);
  fs.writeFileSync(path.join(run, "ship-01.md"), "Fixture PR prepared; CI pending.\n");
  update({ publication_authorized: true, publication_note: "Fixture user requested a draft PR.",
    pr_url: "https://github.com/example/project/pull/1", latest_ship: "ship-01.md", ci_status: "pending", stage: "waiting_ci" });
  update({ stage: "ready_for_human" }, /CI must pass/);
  update({ ci_status: "passed", stage: "ready_for_human" });
  assert.equal(read().stage, "ready_for_human");
  update({ stage: "building", candidate_sha: null, reviewed_sha: null, review_verdict: null,
    ci_status: "unknown", round: 2, repair_count: 1 });
  update({ repair_count: 4, round: 5 }, /limit exhausted/);
  update({ repair_count: 0, round: 1 }, /cannot be reset/);
  update({ max_repair_rounds: 4 }, /authorization/);
  fs.writeFileSync(path.join(initial.worktree_path, "ci-proof.txt"), "repair fixture\n");
  execFileSync("git", ["-C", initial.worktree_path, "add", "ci-proof.txt"]);
  execFileSync("git", ["-C", initial.worktree_path, "commit", "-m", "Repair fixture"], { stdio: "pipe" });
  const repaired = execFileSync("git", ["-C", initial.worktree_path, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  fs.writeFileSync(path.join(run, "build-02.md"), `Repaired candidate: ${repaired}\n`);
  update({ stage: "reviewing", candidate_sha: repaired, latest_build: "build-02.md" });
  update({ stage: "shipping", reviewed_sha: candidate, review_verdict: "pass" }, /exact candidate/);
  fs.writeFileSync(path.join(run, "review-02.md"), `Reviewed: ${repaired}\nVerdict: pass\n`);
  update({ stage: "shipping", reviewed_sha: repaired, review_verdict: "pass", latest_review: "review-02.md" });
  fs.writeFileSync(path.join(run, "ship-02.md"), `Existing PR updated to ${repaired}; CI passed.\n`);
  update({ stage: "ready_for_human", ci_status: "passed", latest_ship: "ship-02.md" });
  assert.equal(read().pr_url, "https://github.com/example/project/pull/1");
  assert.equal(read().repair_count, 1);
  assert.equal(read().candidate_sha, repaired);
  assert.equal(git("status", "--porcelain"), mainStatus);
  assert.equal(git("rev-parse", "HEAD"), base);

  // Exercise the real installer with an isolated homedir implementation, never
  // overriding HOME or touching a provider configuration in the real home.
  const fakeHome = path.join(temporary, "installed home");
  const installer = path.join(ROOT, "bin/install-skills.mjs");
  const installCode = `import os from 'node:os'; import { pathToFileURL } from 'node:url';
    const isolatedHome = process.argv[1];
    os.homedir = () => isolatedHome;
    process.argv = [process.execPath, process.argv[2], ...process.argv.slice(3)];
    await import(pathToFileURL(process.argv[1]));`;
  const installed = spawnSync(process.execPath, ["--input-type=module", "-e", installCode, fakeHome, installer, ...skills], { encoding: "utf8" });
  assert.equal(installed.status, 0, installed.stderr);
  for (const name of skills) {
    const source = path.join(ROOT, "skills", name);
    const destination = path.join(fakeHome, ".agents", "skills", name);
    assert.equal(fs.readFileSync(path.join(destination, "SKILL.md"), "utf8"), fs.readFileSync(path.join(source, "SKILL.md"), "utf8"));
    assert.match(fs.readFileSync(path.join(destination, "agents/openai.yaml"), "utf8"), /allow_implicit_invocation: false/);
  }
  assert.equal(fs.existsSync(path.join(fakeHome, ".codex")), false);
  assert.equal(fs.existsSync(path.join(fakeHome, ".claude")), false);
  const installedHelper = path.join(fakeHome, ".agents/skills/factory-workflow/scripts/factory-run.mjs");
  const installedRun = spawnSync(process.execPath, [installedHelper, "init", "--repo", repo,
    "--id", "installed", "--base", "HEAD", "--root", runRoot], { encoding: "utf8", cwd: temporary });
  assert.equal(installedRun.status, 0, installedRun.stderr);
  assert.match(fs.readFileSync(path.join(JSON.parse(installedRun.stdout).run_dir, "task.md"), "utf8"), /Acceptance criteria/);
  checks++;

  // Relative references must survive installation, including from an unrelated cwd.
  function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(filename) : [filename];
    });
  }
  for (const name of skills) {
    for (const filename of walk(path.join(fakeHome, ".agents/skills", name)).filter((file) => file.endsWith(".md"))) {
      const content = fs.readFileSync(filename, "utf8");
      assert.doesNotMatch(content, /\[TODO/);
      for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
        if (!/^(?:https?:|#)/.test(match[1])) assert.ok(fs.existsSync(path.resolve(path.dirname(filename), match[1])), `Missing reference in ${filename}: ${match[1]}`);
      }
    }
  }
  checks++;
  console.log(`Passed ${checks} factory helper/packaging checks, including local build-review-CI repair state and installed assets.`);
} finally {
  // All fixture repositories, worktrees, and home data are inside this directory.
  fs.rmSync(temporary, { recursive: true, force: true });
}
