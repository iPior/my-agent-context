#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOME = os.homedir();
const SOURCE_SKILLS_DIR = path.join(ROOT, "skills");
const SKILLS_DIR = path.join(HOME, ".agents", "skills");

// --- helpers -----------------------------------------------------------------
function discoverSkills() {
  return fs
    .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => ({ name: e.name, dir: path.join(SOURCE_SKILLS_DIR, e.name), skillMd: path.join(SOURCE_SKILLS_DIR, e.name, "SKILL.md") }))
    .filter((s) => fs.existsSync(s.skillMd));
}

function printHelp(skills) {
  console.log(`install-skills - install personal agent skills

Usage:
  npx --package=github:iPior/my-agent-context install-skills <skills...>
  npx --package=github:iPior/my-agent-context install-skills --all

Options:
  --all           Install every available skill
  --claude        Link Claude Code skills to the shared skills folder
  --codex         Link Codex skills to the shared skills folder
  --no-providers  Install shared skills without changing harness links
  --list, -l      List available skills and exit
  --help, -h      Show this help

Installs into ~/.agents/skills/ and prompts for Claude Code, Codex, both, or neither.
Harness skills folders are symlinked to the shared folder; existing paths are backed up.
Use --claude, --codex, or --no-providers for non-interactive installs.
Does not install AGENTS.md or change provider settings.
With no arguments, shows this help.

Available skills: ${skills.map((skill) => skill.name).join(", ") || "(none)"}`);
}

function stat(filename) {
  try {
    return fs.lstatSync(filename);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function backup(filename) {
  if (!stat(filename)) return;
  let destination = `${filename}.backup`;
  let suffix = 1;
  while (stat(destination)) destination = `${filename}.backup.${suffix++}`;
  fs.renameSync(filename, destination);
  console.log(`Backed up: ${filename} -> ${destination}`);
}

async function chooseProviders(flags) {
  const providers = ["claude", "codex"].filter((name) => flags.has(`--${name}`));
  if (flags.has("--no-providers")) {
    if (providers.length) throw new Error("--no-providers cannot be combined with --claude or --codex.");
    return [];
  }
  if (providers.length) return providers;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Choose harnesses with --claude, --codex, or --no-providers for a non-interactive install.");
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const answer = await new Promise((resolve, reject) => {
        const closed = () => reject(new Error("Harness selection cancelled."));
        rl.once("close", closed);
        rl.question("Which harness should use these skills? [1] Claude Code [2] Codex [3] Both [4] Neither (shared only): ", (value) => {
          rl.removeListener("close", closed);
          resolve(value.trim().toLowerCase());
        });
      });
      const choices = { "1": ["claude"], claude: ["claude"], "2": ["codex"], codex: ["codex"], "3": ["claude", "codex"], both: ["claude", "codex"], "4": [], neither: [] };
      if (Object.prototype.hasOwnProperty.call(choices, answer)) return choices[answer];
      console.log("Enter 1, 2, 3, or 4.");
    }
  } finally {
    rl.close();
  }
}

function providerTargets(providers) {
  const targets = providers.map((provider) => provider === "claude"
    ? path.join(HOME, ".claude", "skills")
    : path.resolve(process.env.CODEX_HOME || path.join(HOME, ".codex"), "skills"));
  for (const target of targets) {
    const relative = path.relative(SKILLS_DIR, target);
    const reverse = path.relative(target, SKILLS_DIR);
    const nested = (value) => value && value !== ".." && !value.startsWith(`..${path.sep}`) && !path.isAbsolute(value);
    if (nested(relative) || nested(reverse)) throw new Error(`Harness skills folder must not contain or be inside the shared folder: ${target}`);
  }
  return [...new Set(targets)].filter((target) => target !== SKILLS_DIR);
}

function linkProviders(targets) {
  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (stat(target)?.isSymbolicLink() &&
        path.resolve(path.dirname(target), fs.readlinkSync(target)) === SKILLS_DIR) {
      console.log(`Already linked: ${target}`);
      continue;
    }
    backup(target);
    fs.symlinkSync(SKILLS_DIR, target, process.platform === "win32" ? "junction" : "dir");
    console.log(`Linked: ${target} -> ${SKILLS_DIR}`);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("-")));
  const names = argv.filter((a) => !a.startsWith("-"));

  const skills = discoverSkills();

  if (flags.has("--help") || flags.has("-h")) return printHelp(skills);
  if (flags.has("--list") || flags.has("-l")) {
    process.stdout.write(skills.map((s) => `  ${s.name}`).join("\n") + "\n");
    return;
  }

  const allowed = new Set(["--help", "-h", "--list", "-l", "--all", "--claude", "--codex", "--no-providers"]);
  for (const flag of flags) {
    if (!allowed.has(flag)) throw new Error(`Unknown option: ${flag}`);
  }
  if (flags.has("--all") && names.length) throw new Error("--all cannot be combined with skill names.");
  if (!flags.has("--all") && !names.length) return printHelp(skills);

  // Which skills?
  let selected = skills;
  if (names.length) {
    selected = names.map((n) => {
      const s = skills.find((sk) => sk.name === n);
      if (!s) {
        console.error(`Unknown skill: ${n}\nAvailable: ${skills.map((sk) => sk.name).join(", ")}`);
        process.exit(1);
      }
      return s;
    });
  }

  const providers = await chooseProviders(flags);
  const targets = providerTargets(providers);

  if (selected.length) fs.mkdirSync(SKILLS_DIR, { recursive: true });
  if (selected.length) console.log(`\nInstalling into ${SKILLS_DIR.replace(HOME, "~")}`);
  for (const skill of selected) {
    const dest = path.join(SKILLS_DIR, skill.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(skill.dir, dest, { recursive: true });
    console.log(`  ✓ ${skill.name}  → ${path.join(dest, "SKILL.md").replace(HOME, "~")}`);
  }

  if (selected.length) linkProviders(targets);

  console.log("\nDone. Open a new harness session if the skills are not yet listed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
