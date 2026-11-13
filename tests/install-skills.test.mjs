import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(ROOT, "bin/install-skills.mjs");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "pior-skill-installer-"));
const env = { ...process.env };
delete env.CODEX_HOME;
let checks = 0;
const bootstrap = `import os from 'node:os'; import { pathToFileURL } from 'node:url';
  const isolatedHome = process.argv[1];
  os.homedir = () => isolatedHome;
  if (process.argv[3] === 'tty') {
    Object.defineProperty(process.stdin, 'isTTY', { value: true });
    Object.defineProperty(process.stdout, 'isTTY', { value: true });
  }
  process.argv = [process.execPath, process.argv[2], ...process.argv.slice(4)];
  await import(pathToFileURL(process.argv[1]));`;

function args(home, flags, tty = false) {
  return ["--input-type=module", "-e", bootstrap, home, installer, tty ? "tty" : "pipe", ...flags];
}

function run(home, flags, errorPattern, extraEnv = {}) {
  const result = spawnSync(process.execPath, args(home, flags), { encoding: "utf8", env: { ...env, ...extraEnv } });
  assert.equal(result.status, errorPattern ? 1 : 0, result.stderr);
  if (errorPattern) assert.match(result.stderr, errorPattern);
  checks++;
  return result;
}

function checkLink(home, harness, root = path.join(home, `.${harness}`)) {
  const target = path.join(root, "skills");
  assert.ok(fs.lstatSync(target).isSymbolicLink());
  assert.equal(fs.realpathSync(target), fs.realpathSync(path.join(home, ".agents/skills")));
  const helper = path.join(target, "factory-workflow/scripts/factory-run.mjs");
  assert.ok(fs.existsSync(helper));
  assert.equal(fs.readFileSync(helper, "utf8"), fs.readFileSync(path.join(ROOT, "skills/factory-workflow/scripts/factory-run.mjs"), "utf8"));
}

async function interactive(home, answers, cancelled = false) {
  const child = spawn(process.execPath, args(home, ["factory-workflow"], true), { env });
  let stdout = "";
  let stderr = "";
  let answered = 0;
  const timer = setTimeout(() => child.kill(), 5000);
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.stdin.on("error", () => {});
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    const prompts = (stdout.match(/Which harness should use these skills\?/g) || []).length;
    if (prompts > answered) {
      answered++;
      if (cancelled) child.stdin.end();
      else child.stdin.write(`${answers.shift()}\n`);
    }
  });
  const status = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve(code));
  }).finally(() => clearTimeout(timer));
  assert.equal(status, cancelled ? 1 : 0, stderr);
  if (cancelled) assert.match(stderr, /cancelled/);
  checks++;
  return stdout;
}

try {
  const passive = path.join(temporary, "passive");
  run(passive, ["--help"]);
  run(passive, ["--list"]);
  run(passive, []);
  run(passive, ["factory-workflow"], /Choose harnesses/);
  run(passive, ["--claude", "missing-skill"], /Unknown skill/);
  run(passive, ["--claude", "--no-providers", "factory-workflow"], /cannot be combined/);
  run(passive, ["--all", "factory-workflow"], /cannot be combined/);
  run(passive, ["--unknown", "factory-workflow"], /Unknown option/);
  assert.equal(fs.existsSync(passive), false);

  const claude = path.join(temporary, "claude home");
  run(claude, ["--claude", "factory-workflow"]);
  checkLink(claude, "claude");
  assert.equal(fs.existsSync(path.join(claude, ".codex")), false);
  const correctLink = fs.readlinkSync(path.join(claude, ".claude/skills"));
  const repeated = run(claude, ["--claude", "factory-workflow"]);
  assert.match(repeated.stdout, /Already linked/);
  assert.equal(fs.readlinkSync(path.join(claude, ".claude/skills")), correctLink);
  assert.equal(fs.existsSync(path.join(claude, ".claude/skills.backup")), false);
  const sharedExtra = path.join(claude, ".agents/skills/unrelated/SKILL.md");
  fs.mkdirSync(path.dirname(sharedExtra));
  fs.writeFileSync(sharedExtra, "keep shared skill");
  fs.writeFileSync(path.join(claude, ".agents/skills/factory-workflow/stale.txt"), "old version");
  run(claude, ["--claude", "factory-workflow"]);
  assert.equal(fs.readFileSync(sharedExtra, "utf8"), "keep shared skill");
  assert.equal(fs.existsSync(path.join(claude, ".agents/skills/factory-workflow/stale.txt")), false);

  const both = path.join(temporary, "both");
  run(both, ["--claude", "--codex", "--all"]);
  checkLink(both, "claude");
  checkLink(both, "codex");
  fs.writeFileSync(path.join(both, ".agents/skills/factory-workflow/shared.txt"), "one copy");
  assert.equal(fs.readFileSync(path.join(both, ".claude/skills/factory-workflow/shared.txt"), "utf8"), "one copy");
  assert.equal(fs.readFileSync(path.join(both, ".codex/skills/factory-workflow/shared.txt"), "utf8"), "one copy");

  const existing = path.join(temporary, "existing");
  const previous = path.join(existing, ".claude/skills");
  fs.mkdirSync(previous, { recursive: true });
  fs.writeFileSync(path.join(previous, "custom.txt"), "keep directory");
  fs.writeFileSync(`${previous}.backup`, "keep older backup");
  fs.mkdirSync(path.join(existing, ".codex"));
  fs.writeFileSync(path.join(existing, ".codex/skills"), "keep file");
  fs.writeFileSync(path.join(existing, ".claude/CLAUDE.md"), "keep instructions");
  run(existing, ["--claude", "--codex", "factory-workflow"]);
  assert.equal(fs.readFileSync(`${previous}.backup`, "utf8"), "keep older backup");
  assert.equal(fs.readFileSync(`${previous}.backup.1/custom.txt`, "utf8"), "keep directory");
  assert.equal(fs.readFileSync(path.join(existing, ".codex/skills.backup"), "utf8"), "keep file");
  assert.equal(fs.readFileSync(path.join(existing, ".claude/CLAUDE.md"), "utf8"), "keep instructions");
  checkLink(existing, "claude");
  checkLink(existing, "codex");

  const dangling = path.join(temporary, "dangling");
  fs.mkdirSync(path.join(dangling, ".claude"), { recursive: true });
  fs.symlinkSync("/nonexistent/old-skills", path.join(dangling, ".claude/skills"));
  run(dangling, ["--claude", "factory-workflow"]);
  assert.equal(fs.readlinkSync(path.join(dangling, ".claude/skills.backup")), "/nonexistent/old-skills");
  checkLink(dangling, "claude");

  const codex = path.join(temporary, "custom codex");
  const configDir = path.join(codex, "custom config");
  run(codex, ["--codex", "factory-workflow"], null, { CODEX_HOME: configDir });
  checkLink(codex, "codex", configDir);
  assert.equal(fs.existsSync(path.join(codex, ".claude")), false);
  assert.equal(fs.existsSync(path.join(codex, ".codex")), false);

  const shared = path.join(temporary, "shared");
  run(shared, ["--no-providers", "factory-workflow"]);
  assert.ok(fs.existsSync(path.join(shared, ".agents/skills/factory-workflow/SKILL.md")));
  assert.equal(fs.existsSync(path.join(shared, ".claude")), false);
  assert.equal(fs.existsSync(path.join(shared, ".codex")), false);
  const nested = path.join(temporary, "nested");
  run(nested, ["--codex", "factory-workflow"], /must not contain or be inside/, { CODEX_HOME: path.join(nested, ".agents/skills") });
  assert.equal(fs.existsSync(nested), false);

  for (const choice of ["1", "2", "3", "4"]) {
    const home = path.join(temporary, `prompt-${choice}`);
    const output = await interactive(home, ["invalid", choice]);
    assert.match(output, /Enter 1, 2, 3, or 4/);
    if (choice === "1" || choice === "3") checkLink(home, "claude");
    else assert.equal(fs.existsSync(path.join(home, ".claude")), false);
    if (choice === "2" || choice === "3") checkLink(home, "codex");
    else assert.equal(fs.existsSync(path.join(home, ".codex")), false);
  }
  const cancelled = path.join(temporary, "cancelled");
  await interactive(cancelled, [], true);
  assert.equal(fs.existsSync(cancelled), false);
  console.log(`Passed ${checks} skill installer checks, including harness selection, shared directory links, backups, and repeat installs.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
