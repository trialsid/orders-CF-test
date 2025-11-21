import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Wrangles the D1 export so tables are created in a safe order for import.
// Cloudflare exports sometimes create orders before users, which breaks import.

const fileArg = process.argv[2] || "backup.sql";
const inputPath = resolve(process.cwd(), fileArg);

const sql = readFileSync(inputPath, "utf8");
const lines = sql.split(/\r?\n/);

const blocks = [];
let current = [];

const startNewBlock = () => {
  if (current.length) {
    blocks.push(current);
    current = [];
  }
};

const isBlockStart = (line) =>
  /^CREATE TABLE /i.test(line) ||
  /^CREATE INDEX /i.test(line) ||
  /^DELETE FROM sqlite_sequence/i.test(line) ||
  /^INSERT INTO "sqlite_sequence"/i.test(line);

for (const line of lines) {
  if (isBlockStart(line)) {
    startNewBlock();
  }
  current.push(line);
}
startNewBlock();

const nameFor = (block, index) => {
  const first = block.find((l) => l.trim().length) || "";
  const tableMatch = first.match(/^CREATE TABLE\s+"?([A-Za-z0-9_]+)"?/i);
  if (tableMatch) return tableMatch[1];
  const indexMatch = first.match(/^CREATE INDEX\s+"?([A-Za-z0-9_]+)"?/i);
  if (indexMatch) return `index:${indexMatch[1]}`;
  if (/^DELETE FROM sqlite_sequence/i.test(first) || /^INSERT INTO "sqlite_sequence"/i.test(first)) {
    return "sqlite_sequence";
  }
  return index === 0 ? "preamble" : "misc";
};

const desiredOrder = ["preamble", "admin_config", "users", "user_addresses", "orders", "d1_migrations", "sqlite_sequence"];
const selected = new Set();
const ordered = [];

for (const target of desiredOrder) {
  const idx = blocks.findIndex((block, i) => !selected.has(i) && nameFor(block, i) === target);
  if (idx !== -1) {
    ordered.push(blocks[idx]);
    selected.add(idx);
  }
}

blocks.forEach((block, i) => {
  if (!selected.has(i)) {
    ordered.push(block);
  }
});

const output = ordered.map((block) => block.join("\n")).join("\n");
writeFileSync(inputPath, output, "utf8");
console.log(`Reordered ${ordered.length} blocks in ${fileArg}.`);
