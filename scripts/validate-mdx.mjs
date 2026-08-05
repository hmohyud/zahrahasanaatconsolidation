// Parses every converted file with @tinacms/mdx and reports any
// invalid_markdown nodes (Tina's parse-failure marker).
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseMDX } from '@tinacms/mdx';

const leafTemplates = [
    { name: 'Gallery', fields: [ { type: 'rich-text', name: 'children' } ] },
    { name: 'Embed', fields: [
      { type: 'string', name: 'url' }, { type: 'string', name: 'title' },
      { type: 'number', name: 'aspect' } ] },
    { name: 'VideoFile', fields: [
      { type: 'string', name: 'src' }, { type: 'image', name: 'poster' } ] },
    { name: 'ButtonRow', fields: [ { type: 'rich-text', name: 'children' } ] },
    { name: 'ContactCard', fields: [
      { type: 'string', name: 'heading' }, { type: 'string', name: 'email' },
      { type: 'string', name: 'phone' }, { type: 'string', name: 'hours' },
      { type: 'string', name: 'address' }, { type: 'string', name: 'note' } ] },
  ];

const bodyField = {
  type: 'rich-text', name: 'body', isBody: true,
  templates: [
    { name: 'MediaText', fields: [
      { type: 'image', name: 'image' }, { type: 'string', name: 'alt' },
      { type: 'boolean', name: 'mediaRight' },
      { type: 'rich-text', name: 'children', templates: leafTemplates } ] },
    { name: 'CoverCard', fields: [
      { type: 'rich-text', name: 'children', templates: leafTemplates } ] },
    ...leafTemplates,
  ],
};

function findInvalid(node, out) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'invalid_markdown') out.push(node.value?.slice(0, 120) || '(unknown)');
  for (const key of ['children']) (node[key] || []).forEach((c) => findInvalid(c, out));
  if (node.props) for (const v of Object.values(node.props)) findInvalid(v, out);
}

let bad = 0, total = 0;
for (const dir of ['content/pages', 'content/stories']) {
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    total++;
    const { content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
    try {
      const ast = parseMDX(content, bodyField, (u) => u);
      const invalid = [];
      findInvalid(ast, invalid);
      if (invalid.length) { bad++; console.log(`INVALID ${dir}/${f}:`, invalid[0]); }
    } catch (e) {
      bad++; console.log(`THROW ${dir}/${f}: ${e.message.slice(0, 120)}`);
    }
  }
}
console.log(`\n${total} files checked, ${bad} with parse problems`);
