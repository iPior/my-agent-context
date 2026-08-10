#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOME = os.homedir();
const SKILLS_DIR = path.join(HOME, ".agents", "skills");

// --- helpers -----------------------------------------------------------------
function discoverSkills() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith(".") && e.name !== "bin" && e.name !== "node_modules")
    .map((e) => ({ name: e.name, dir: path.join(ROOT, e.name), skillMd: path.join(ROOT, e.name, "SKILL.md") }))
    .filter((s) => fs.existsSync(s.skillMd));
}

function printHelp(skills) {
  process.stdout.write(
    [
      "my-agent-skills — install personal agent skills",
      "",
      "Usage:",
      "  npx github:iPior/my-agent-skills [skills...] [options]",
      "",
      "Options:",
      "  --list, -l      List available skills and exit",
      "  --help, -h      Show this help",
      "",
      "Skills are installed into ~/.agents/skills/. With no skill names, installs every skill.",
      "Examples:",
      "  npx github:iPior/my-agent-skills",
      "  npx github:iPior/my-agent-skills blog-writer",
      "",
      `Available skills: ${skills.map((s) => s.name).join(", ") || "(none)"}`
    ].join("\n") + "\n"
  );
}

// --- main --------------------------------------------------------------------
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

  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  console.log(`\nInstalling into ${SKILLS_DIR.replace(HOME, "~")}`);
  for (const skill of selected) {
    const dest = path.join(SKILLS_DIR, skill.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(skill.dir, dest, { recursive: true });
    console.log(`  ✓ ${skill.name}  → ${path.join(dest, "SKILL.md").replace(HOME, "~")}`);
  }

  console.log("\nDone. Restart your agent to pick up the new skills.");
}

main();
