import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const SOURCE_ROOTS = ["apps", "packages"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const MAX_FILE_LINES = 350;

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

const measurements = SOURCE_ROOTS.flatMap(sourceFiles).map((file) => ({
  file: relative(process.cwd(), file),
  lines: readFileSync(file, "utf8").split(/\r?\n/).length
}));
const violations = measurements.filter((measurement) => measurement.lines > MAX_FILE_LINES);
const largest = [...measurements].sort((left, right) => right.lines - left.lines).slice(0, 5);

console.log(`Source files measured: ${measurements.length}`);
console.log(`Maximum allowed file length: ${MAX_FILE_LINES} lines`);
for (const measurement of largest) console.log(`${measurement.lines}\t${measurement.file}`);

if (violations.length > 0) {
  console.error("Files exceeding the clean-code size gate:");
  for (const violation of violations) console.error(`${violation.lines}\t${violation.file}`);
  process.exitCode = 1;
}
