#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import { installGlobal } from "./global.mjs";

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
  process.stdout.write(
    [
      "my-agent-context - install personal agent skills and instructions",
      "",
      "Usage:",
      "  npx github:iPior/my-agent-context [skills...] [options]",
      "",
      "Options:",
      "  --list, -l      List available skills and exit",
      "  --help, -h      Show this help",
      "  --claude        Link global instructions for Claude Code",
      "  --codex         Link global instructions for Codex",
      "  --no-providers  Install instructions without changing provider links",
      "  --global-only   Install global instructions without installing skills",
      "",
      "Skills are installed into ~/.agents/skills/. With no skill names, installs every skill.",
      "Prompts for providers unless --claude, --codex, or --no-providers is supplied.",
      "Non-interactive installs must supply one of those flags.",
      "Examples:",
      "  npx github:iPior/my-agent-context",
      "  npx github:iPior/my-agent-context blog-writer",
      "  npx github:iPior/my-agent-context --claude --codex",
      "",
      `Available skills: ${skills.map((s) => s.name).join(", ") || "(none)"}`
    ].join("\n") + "\n"
  );
}

// --- main --------------------------------------------------------------------
async function chooseProviders(flags) {
  const providers = ["claude", "codex"].filter((name) => flags.has(`--${name}`));
  if (flags.has("--no-providers")) {
    if (providers.length) throw new Error("--no-providers cannot be combined with --claude or --codex.");
    return [];
  }
  if (providers.length) return providers;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Choose providers with --claude, --codex, or --no-providers for a non-interactive install.");
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const answer = await new Promise((resolve, reject) => {
        const closed = () => reject(new Error("Provider selection cancelled."));
        rl.once("close", closed);
        rl.question("Which agents do you use? [1] Claude Code [2] Codex [3] Both [4] Neither: ", (value) => {
          rl.removeListener("close", closed);
          resolve(value.trim().toLowerCase());
        });
      });
      const choices = { "1": ["claude"], claude: ["claude"], "2": ["codex"], codex: ["codex"], "3": ["claude", "codex"], both: ["claude", "codex"], "4": [], neither: [] };
      if (Object.hasOwnProperty.call(choices, answer)) return choices[answer];
      console.log("Enter 1, 2, 3, or 4.");
    }
  } finally {
    rl.close();
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

  const allowed = new Set(["--help", "-h", "--list", "-l", "--claude", "--codex", "--no-providers", "--global-only"]);
  for (const flag of flags) {
    if (!allowed.has(flag)) throw new Error(`Unknown option: ${flag}`);
  }
  if (flags.has("--global-only") && names.length) throw new Error("--global-only cannot be combined with skill names.");

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

  if (flags.has("--global-only")) selected = [];
  const providers = await chooseProviders(flags);
  installGlobal(ROOT, HOME, providers);

  if (selected.length) fs.mkdirSync(SKILLS_DIR, { recursive: true });
  if (selected.length) console.log(`\nInstalling into ${SKILLS_DIR.replace(HOME, "~")}`);
  for (const skill of selected) {
    const dest = path.join(SKILLS_DIR, skill.name);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(skill.dir, dest, { recursive: true });
    console.log(`  ✓ ${skill.name}  → ${path.join(dest, "SKILL.md").replace(HOME, "~")}`);
  }

  console.log("\nDone. Restart your agent to pick up the new skills and instructions.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
