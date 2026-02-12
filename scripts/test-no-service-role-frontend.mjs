import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src/', import.meta.url);
const forbiddenPatterns = [
  /\.asServiceRole\b/g,
  /\basServiceRole\b/g
];
const allowedExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
      continue;
    }
    const ext = full.slice(full.lastIndexOf('.'));
    if (allowedExtensions.has(ext)) files.push(full);
  }
  return files;
}

const files = walk(ROOT.pathname);
const violations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content)) {
      violations.push(file.replace(process.cwd() + '/', ''));
      break;
    }
  }
}

if (violations.length > 0) {
  console.error('Found forbidden service-role usage in frontend files:');
  for (const file of violations) {
    console.error(` - ${file}`);
  }
  process.exit(1);
}

console.log(`test-no-service-role-frontend: ok (${files.length} files checked)`);
