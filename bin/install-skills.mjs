#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
  --list, -l      List available skills and exit
  --help, -h      Show this help

Installs into ~/.agents/skills/. Does not install AGENTS.md or change provider links.
With no arguments, shows this help.

Available skills: ${skills.map((skill) => skill.name).join(", ") || "(none)"}`);
}

function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith("-")));
  const names = argv.filter((a) => !a.startsWith("-"));

  const skills = discoverSkills();

  if (flags.has("--help") || flags.has("-h")) return printHelp(skills);
  if (flags.has("--list") || flags.has("-l")) {
    process.stdout.write(skills.map((s) => `  ${s.name}`).join("\n") + "\n");
    return;
  }

  const allowed = new Set(["--help", "-h", "--list", "-l", "--all"]);
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

  if (selected.length) fs.mkdirSync(SKILLS_DIR, { recursive: true });
  if (selected.length) console.log(`\nInstalling into ${SKILLS_DIR.replace(HOME, "~")}`);
  for (const skill of selected) {
    const dest = path.join(SKILLS_DIR, skill.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(skill.dir, dest, { recursive: true });
    console.log(`  ✓ ${skill.name}  → ${path.join(dest, "SKILL.md").replace(HOME, "~")}`);
  }

  console.log("\nDone. Restart your agent to pick up the new skills.");
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
