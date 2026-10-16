// Builds Apex's bundled adblock scriptlet/redirect resources (adblock-rust
// resources.json format) from a uBlock Origin checkout plus Brave's own
// resources. Brave normally ships this file as a component, which only
// official Brave builds can download.
//
// Run: node make_adblock_resources.mjs <uBlock dir> <brave dist/resources.json> <out.json>
//   uBlock:  git clone --depth 1 --branch <release> https://github.com/gorhill/uBlock
//   Brave:   https://raw.githubusercontent.com/brave/adblock-resources/master/dist/resources.json
import {readFileSync, writeFileSync} from 'node:fs';
import {extname, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [ubo, braveJson, out] = process.argv.slice(2).map((p) => resolve(p));
const js = (rel) => import(pathToFileURL(join(ubo, 'src/js', rel)).href);

// Permission bit for uBO's `requiresTrust` scriptlets; Apex grants it only to
// uBlock Origin's own lists (see ad_block_subscription_service_manager.cc).
const kTrusted = 1;
const resources = [];
const seen = new Set();
const add = (r) => {
  if (seen.has(r.name)) return;
  seen.add(r.name);
  resources.push(r);
};

// Scriptlets: uBO's function-style format maps directly onto adblock-rust's.
const {builtinScriptlets} = await js('resources/scriptlets.js');
for (const s of builtinScriptlets) {
  add({
    name: s.name,
    aliases: s.aliases ?? [],
    kind: {mime: s.name.endsWith('.fn') ? 'fn/javascript' : 'application/javascript'},
    content: Buffer.from(s.fn.toString()).toString('base64'),
    dependencies: s.dependencies ?? [],
    ...(s.requiresTrust ? {permission: kTrusted} : {}),
  });
}

// Redirect resources (e.g. noop.js, google-ima.js).
const mimes = {
  '.js': 'application/javascript', '.html': 'text/html', '.txt': 'text/plain',
  '.css': 'text/css', '.json': 'application/json', '.gif': 'image/gif',
  '.png': 'image/png', '.mp3': 'audio/mp3', '.mp4': 'video/mp4', '.xml': 'text/xml',
};
const {default: redirects} = await js('redirect-resources.js');
for (const [name, info] of redirects) {
  const mime = mimes[extname(name)];
  if (!mime) continue;
  let data = readFileSync(join(ubo, 'src/web_accessible_resources', name));
  if (mime.startsWith('text/') || mime.endsWith('javascript')) {
    data = Buffer.from(data.toString('utf8').replace(/\r/g, ''));
  }
  const aliases = info.alias ? [].concat(info.alias) : [];
  add({name, aliases, kind: {mime}, content: data.toString('base64')});
}

// Brave's extra resources (Brave-specific fixes), unless uBO already has them.
for (const r of JSON.parse(readFileSync(braveJson, 'utf8'))) add(r);

writeFileSync(out, JSON.stringify(resources));
console.log(`wrote ${resources.length} resources (${builtinScriptlets.length} scriptlets) to ${out}`);
