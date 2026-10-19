# Apex resources

`resources.json` holds the scriptlets and redirect resources that Apex Browser's
ad blocker uses (for example to remove YouTube ads). Apex downloads it from this
repo every few hours, so it can stay current without a browser update.

A GitHub Actions job (`.github/workflows/build.yml`) rebuilds the file every
6 hours from:

- [uBlock Origin](https://github.com/gorhill/uBlock) scriptlets and redirect
  resources (GPLv3), from its latest code
- [Brave's adblock resources](https://github.com/brave/adblock-resources) (MPL-2.0)

To rebuild by hand: Actions tab → "Build adblock resources" → Run workflow.

Locally: `node make_adblock_resources.mjs <uBlock checkout> <brave resources.json> resources.json`

## Signing

Apex only accepts `resources.json` with a valid `resources.json.sig`: an
Ed25519 signature over `apex-resources\n<version>\n` + the file, made with the
private key in the repo secret `APEX_SIGNING_KEY` (`sign.mjs`).
Apex also refuses versions older than the one it has. The matching public keys
are built into Apex (`browser/ui/apex/apex_adblock_resources.cc`), together
with an offline spare for replacing a leaked key.

## Tor

`.github/workflows/tor.yml` publishes the Tor client for Apex's Tor windows:
daily it checks the Tor Project for a new stable Tor Expert Bundle, verifies the
Tor Project's GPG signature, releases `tor.exe` here, and commits `tor.json`
(version, URL, SHA-256), signed for the purpose "tor".
