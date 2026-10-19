// Bundles Brave's privacy lists (github.com/brave/adblock-lists, MPL-2.0) into
// privacy-lists.json for Apex: {"files": {"<name>": "<file contents>"}}.
// Brave ships these as components that only download for official Brave builds.
// Run: node make_privacy_lists.mjs privacy-lists.json
import {writeFileSync} from 'node:fs';

const base = 'https://raw.githubusercontent.com/brave/adblock-lists/master/brave-lists/';
const names = [
  'debounce.json',                      // skip known tracking redirects
  'clean-urls.json',                    // strip tracking parameters from links
  'clean-urls-permissions.json',
  'query-filter.json',                  // strip tracking query parameters
  'request-otr.json',                   // offer private mode on sensitive sites
  'https-upgrade-exceptions-list.txt',  // sites that break on HTTPS upgrade
  'webcompat-exceptions.json',          // sites that break with fingerprint protections
  'brave-checks.txt',                   // sites that need a Chrome user agent
];

const files = {};
for (const name of names) {
  const response = await fetch(base + name);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const text = await response.text();
  if (name.endsWith('.json')) JSON.parse(text);  // refuse broken JSON
  files[name] = text;
}
writeFileSync(process.argv[2] ?? 'privacy-lists.json', JSON.stringify({files}));
console.log(`bundled ${names.length} lists`);
