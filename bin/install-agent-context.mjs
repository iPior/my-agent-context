#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOME = os.homedir();

function stat(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function backup(file) {
  if (!stat(file)) return;
  let destination = `${file}.backup`;
  let suffix = 1;
  while (stat(destination)) destination = `${file}.backup.${suffix++}`;
  fs.renameSync(file, destination);
  console.log(`Backed up: ${file} -> ${destination}`);
}

function installGlobal(root, home, providers) {
  const source = path.join(root, "global", "AGENTS.md");
  const installed = path.join(home, ".agents", "AGENTS.md");
  const targets = providers.map((provider) => provider === "claude"
    ? path.join(home, ".claude", "CLAUDE.md")
    : path.resolve(process.env.CODEX_HOME || path.join(home, ".codex"), "AGENTS.md"));
  // Check all destinations before replacing any files.
  for (const target of [installed, ...targets]) {
    if (stat(target)?.isDirectory()) throw new Error(`Refusing to replace directory: ${target}`);
    if (target === installed && targets.includes(target)) {
      throw new Error("CODEX_HOME must differ from ~/.agents to avoid a self-referencing link.");
    }
  }

  const contents = fs.readFileSync(source);
  fs.mkdirSync(path.dirname(installed), { recursive: true });
  const existing = stat(installed);
  // Replace symlinks instead of writing through them into a previous clone.
  if (!existing?.isFile() || !fs.readFileSync(installed).equals(contents)) {
    backup(installed);
    fs.writeFileSync(installed, contents);
  }
  console.log(`Installed global instructions: ${installed}`);

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (stat(target)?.isSymbolicLink() &&
        path.resolve(path.dirname(target), fs.readlinkSync(target)) === installed) {
      console.log(`Already linked: ${target}`);
      continue;
    }
    backup(target);
    fs.symlinkSync(installed, target);
    console.log(`Linked: ${target} -> ${installed}`);
  }
}

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
  const args = process.argv.slice(2);
  const allowed = new Set(["--help", "-h", "--claude", "--codex", "--no-providers"]);
  for (const arg of args) {
    if (!allowed.has(arg)) throw new Error(`Unknown argument: ${arg}`);
  }
  const flags = new Set(args);
  if (flags.has("--help") || flags.has("-h")) {
    console.log(`install-agent-context - install global AGENTS.md instructions

Usage:
  npx --package=github:iPior/my-agent-context install-agent-context [options]

Options:
  --claude        Link instructions for Claude Code
  --codex         Link instructions for Codex
  --no-providers  Install instructions without changing provider links
  --help, -h      Show this help

Copies global/AGENTS.md to ~/.agents/AGENTS.md. Does not install skills.
Prompts for providers unless --claude, --codex, or --no-providers is supplied.
Non-interactive installs must supply one of those provider flags.`);
    return;
  }
  const providers = await chooseProviders(flags);
  installGlobal(ROOT, HOME, providers);
  console.log("\nDone. Restart your agent to pick up the new instructions.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
