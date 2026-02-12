import assert from 'node:assert/strict';
import fs from 'node:fs';

const pagesConfigSource = fs.readFileSync('src/pages.config.js', 'utf8');
const layoutSource = fs.readFileSync('src/Layout.jsx', 'utf8');
const megaSource = fs.readFileSync('src/components/layout/MegaMenu.jsx', 'utf8');

const registeredPageRegex = /"([A-Za-z0-9_]+)"\s*:\s*[A-Za-z0-9_]+,/g;
const navPageRegex = /page:\s*'([^']+)'/g;

function extractWithRegex(source, regex, index = 1) {
  const out = [];
  let match = null;
  while ((match = regex.exec(source))) out.push(match[index]);
  return out;
}

const registered = new Set(extractWithRegex(pagesConfigSource, registeredPageRegex));
const layoutPages = extractWithRegex(layoutSource, navPageRegex);
const megaPages = extractWithRegex(megaSource, navPageRegex);

const unknownLayout = layoutPages.filter((page) => !registered.has(page));
const unknownMega = megaPages.filter((page) => !registered.has(page));

assert.equal(unknownLayout.length, 0, `Unknown quick-access pages in Layout: ${unknownLayout.join(', ')}`);
assert.equal(unknownMega.length, 0, `Unknown quick-access pages in MegaMenu: ${unknownMega.join(', ')}`);

console.log('✅ Quick access page links all resolve to registered pages.');
