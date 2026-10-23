import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".quietbridge",
  "coverage",
  "dist",
  "dist-server",
  "node_modules",
  "playwright-report",
  "test-results"
]);
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".env",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml"
]);
const SECRET_PATTERNS = [
  { name: "AWS access key", expression: /AKIA[0-9A-Z]{16}/g },
  { name: "GitHub token", expression: /gh[pousr]_[A-Za-z0-9_]{36,}/g },
  { name: "OpenAI key", expression: /sk-[A-Za-z0-9_-]{32,}/g },
  { name: "private key", expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

function textFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return IGNORED_DIRECTORIES.has(entry.name) ? [] : textFiles(path);
    if (path.endsWith(join("scripts", "scan-secrets.mjs"))) return [];
    return TEXT_EXTENSIONS.has(extname(entry.name)) || entry.name === ".env.example" ? [path] : [];
  });
}

const findings = [];
for (const file of textFiles(process.cwd())) {
  const content = readFileSync(file, "utf8");
  for (const pattern of SECRET_PATTERNS) {
    pattern.expression.lastIndex = 0;
    if (pattern.expression.test(content)) {
      findings.push({ file: relative(process.cwd(), file), type: pattern.name });
    }
  }
}

if (findings.length > 0) {
  for (const finding of findings) console.error(`${finding.type}: ${finding.file}`);
  process.exitCode = 1;
} else {
  console.log("Secret scan passed: no high-confidence credential patterns found.");
}
