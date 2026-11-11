const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, '');

function attrsFromTag(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/\s([a-zA-Z:-]+)\s*=\s*(['"])(.*?)\2/g)) {
    attrs[match[1].toLowerCase()] = match[3];
  }
  return attrs;
}

function localReferences() {
  return [...htmlWithoutComments.matchAll(/\s(?:href|src)=['"]([^'"]+)['"]/g)].map((match) => match[1]);
}

function imageTags() {
  return [...htmlWithoutComments.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
}

test('local references exist and email links use mailto', () => {
  const issues = [];

  for (const ref of localReferences()) {
    if (/^(https?:|mailto:|#)/.test(ref)) {
      continue;
    }

    if (/^[^:@\s]+@[^:\s]+$/.test(ref)) {
      issues.push(`${ref} should be mailto:${ref}`);
      continue;
    }

    const localPath = path.join(root, ref.split(/[?#]/)[0]);
    if (!fs.existsSync(localPath)) {
      issues.push(`${ref} does not exist`);
    }
  }

  assert.deepEqual(issues, []);
});

test('inline DOM id references point at real elements', () => {
  const declaredIds = new Set([...htmlWithoutComments.matchAll(/\sid=(['"])(.*?)\1/g)].map((match) => match[2]));
  const referencedIds = [...htmlWithoutComments.matchAll(/getElementById\((['"])(.*?)\1\)/g)].map((match) => match[2]);
  const missingIds = referencedIds.filter((id) => !declaredIds.has(id));

  assert.deepEqual(missingIds, []);
});

test('images have accessible alt text and lazy loading where appropriate', () => {
  const issues = [];

  for (const tag of imageTags()) {
    const attrs = attrsFromTag(tag);
    const src = attrs.src || '(missing src)';

    if (!Object.prototype.hasOwnProperty.call(attrs, 'alt')) {
      issues.push(`${src} is missing alt text`);
    }

    if (src !== 'images/cpw_43.jpeg' && attrs.loading !== 'lazy') {
      issues.push(`${src} should use loading="lazy"`);
    }

    if (src !== 'images/cpw_43.jpeg' && attrs.decoding !== 'async') {
      issues.push(`${src} should use decoding="async"`);
    }
  }

  assert.deepEqual(issues, []);
});

test('table rows are structurally balanced', () => {
  const issues = [];
  const tableStack = [];
  const tagPattern = /<\/?(?:table|tr|td)\b[^>]*>/gi;

  for (const match of htmlWithoutComments.matchAll(tagPattern)) {
    const tag = match[0].toLowerCase();
    const line = htmlWithoutComments.slice(0, match.index).split('\n').length;

    if (tag.startsWith('<table')) {
      tableStack.push({ rowOpen: false, line });
      continue;
    }

    const currentTable = tableStack[tableStack.length - 1];

    if (tag.startsWith('</table')) {
      if (!currentTable) {
        issues.push(`line ${line}: </table> without matching <table>`);
      } else if (currentTable.rowOpen) {
        issues.push(`line ${line}: </table> before closing current <tr>`);
        tableStack.pop();
      } else {
        tableStack.pop();
      }
      continue;
    }

    if (!currentTable) {
      issues.push(`line ${line}: ${tag} outside a table`);
      continue;
    }

    if (tag.startsWith('<tr')) {
      if (currentTable.rowOpen) {
        issues.push(`line ${line}: <tr> before previous row was closed`);
      }
      currentTable.rowOpen = true;
      continue;
    }

    if (tag.startsWith('</tr')) {
      if (!currentTable.rowOpen) {
        issues.push(`line ${line}: </tr> without matching <tr>`);
      }
      currentTable.rowOpen = false;
      continue;
    }

    if (tag.startsWith('<td') && !currentTable.rowOpen) {
      issues.push(`line ${line}: <td> without an open <tr>`);
    }
  }

  if (tableStack.length > 0) {
    issues.push(`${tableStack.length} table(s) were not closed`);
  }

  assert.deepEqual(issues, []);
});

test('HTML has no common syntax cleanup issues', () => {
  const issues = [];

  if (/&nbsp(?!;)/.test(htmlWithoutComments)) {
    issues.push('Some &nbsp entities are missing semicolons');
  }

  if (/href=(['"])[^'"]*&[^a][^'"]*\1/.test(htmlWithoutComments)) {
    issues.push('Some href values contain unescaped ampersands');
  }

  if (/<[^>]+,\s*(?:height|style)=/.test(htmlWithoutComments)) {
    issues.push('Some tags contain stray comma attributes');
  }

  if (/<p>\s*<\/p>/.test(htmlWithoutComments)) {
    issues.push('Empty paragraphs are used for spacing');
  }

  assert.deepEqual(issues, []);
});
