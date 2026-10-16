# Apex adblock resources

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
