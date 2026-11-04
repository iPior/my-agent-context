import fs from "node:fs";
import path from "node:path";

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

export function installGlobal(root, home, providers) {
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
