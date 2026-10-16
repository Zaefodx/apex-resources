// Signs resources.json for Apex. Writes resources.json.sig:
//   {"version": <build number>, "signature": <base64 Ed25519 signature>}
// The signature covers "apex-resources\n<version>\n" + the exact file bytes, so
// neither the file nor its build number can be changed or swapped.
// Run: APEX_SIGNING_KEY=<base64 seed> node sign_resources.mjs resources.json <version>
import {createPrivateKey, sign} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';

const [file, versionArg] = process.argv.slice(2);
const version = Number(versionArg);
if (!file || !Number.isSafeInteger(version) || version <= 0) {
  throw new Error('usage: node sign_resources.mjs <file> <positive integer version>');
}
const seed = Buffer.from(process.env.APEX_SIGNING_KEY ?? '', 'base64');
if (seed.length !== 32) throw new Error('APEX_SIGNING_KEY must be a base64 32-byte Ed25519 seed');

// PKCS#8 wrapper for a raw Ed25519 seed.
const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
const key = createPrivateKey({key: pkcs8, format: 'der', type: 'pkcs8'});
const message = Buffer.concat([Buffer.from(`apex-resources\n${version}\n`), readFileSync(file)]);
const signature = sign(null, message, key).toString('base64');
writeFileSync(`${file}.sig`, JSON.stringify({version, signature}) + '\n');
console.log(`signed ${file} as version ${version}`);
