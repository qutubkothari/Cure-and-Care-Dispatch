import fs from 'node:fs';
import path from 'node:path';

const reportPath = process.argv[2] || 'eslint-client-report.json';
const raw = fs.readFileSync(reportPath, 'utf8');
const report = JSON.parse(raw);

let totalErrors = 0;
let totalWarnings = 0;

/** @type {Map<string, number>} */
const ruleCounts = new Map();
/** @type {Map<string, {file:string,line:number,column:number,message:string,severity:number}>} */
const examples = new Map();
/** @type {Map<string, number>} */
const fileCounts = new Map();

for (const item of report) {
  totalErrors += item.errorCount || 0;
  totalWarnings += item.warningCount || 0;

  const filePath = item.filePath || 'UNKNOWN_FILE';
  for (const msg of item.messages || []) {
    const rule = msg.ruleId || 'NO_RULE';
    const severity = msg.severity ?? 0;
    const key = `${severity}:${rule}`;

    ruleCounts.set(key, (ruleCounts.get(key) || 0) + 1);
    fileCounts.set(filePath, (fileCounts.get(filePath) || 0) + 1);

    if (!examples.has(key)) {
      examples.set(key, {
        file: filePath,
        line: msg.line || 0,
        column: msg.column || 0,
        message: msg.message || '',
        severity
      });
    }
  }
}

const sortedRules = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
const sortedFiles = [...fileCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);

console.log(`ESLint report: ${path.resolve(reportPath)}`);
console.log(`Files: ${report.length}`);
console.log(`Errors: ${totalErrors}  Warnings: ${totalWarnings}`);

console.log('\nTop rules:');
for (const [key, n] of sortedRules) {
  const [sev, rule] = key.split(':');
  const ex = examples.get(key);
  const base = ex ? `${path.basename(ex.file)}:${ex.line}:${ex.column} ${ex.message}` : '';
  console.log(`${String(n).padStart(4)}  sev=${sev}  ${rule}  ex: ${base}`);
}

console.log('\nTop files:');
for (const [fp, n] of sortedFiles) {
  console.log(`${String(n).padStart(4)}  ${fp}`);
}
