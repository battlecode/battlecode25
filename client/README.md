# Battlecode Client 🌱
## Overview
- `src-tauri` - Contains Rust code to wrap Electron.js as an app via Tauri.
- `src`
  - `components` - React Components
  - `pages` - `Queue`, `Runner`, `Game` pages, and more
  - `playback` - Load up battlecode replay files (flatbuffers) into abstract game objects
  - `util` - Various Utility Tools

## Running Locally
To run the client locally:
1. `npm i` to install dependencies and prettier
3. `npm run fix-schema` to fix `TS2307: Cannot find module 'flatbuffers' or its corresponding type declarations.`
4. `npm run watch` to run the web app.

To run the desktop version of the app which has access to the runner,
1. Ensure that the [rust compiler](https://www.rust-lang.org/tools/install) is installed
2. Run `npm run tauri-watch`, or `npm run electron-watch` if the former doesn't work

Run `npx prettier [file].tsx --write` on any changed files to standardize the format. 
