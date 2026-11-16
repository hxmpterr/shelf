# Shelf

A game library and launcher that runs entirely in the browser. Built-in games work offline. Your own games play through [EmulatorJS](https://emulatorjs.org).

## Publish on GitHub Pages
1. Create a new GitHub repository and upload every file in this folder (keep the `.nojekyll` file).
2. Go to **Settings → Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, then Save.
3. After a minute your site is live at `https://<your-name>.github.io/<repo>/`.

## Run locally
Service workers need `http://localhost` (opening the file directly won't work):

    python3 -m http.server 8000     # or: npx serve

Then open http://localhost:8000.

## Notes
- PlayStation games: select the `.cue` and `.bin` together (or drag both in). Shelf bundles them into one game. Single `.iso`, `.chd` and `.pbp` files work as they are.
- The Supported consoles button in the sidebar lists every console and file type.
- Cover not right? Click the pencil on a game card to pick your own image.
- Games you add are stored in your browser (IndexedDB) on that device. Nothing is uploaded anywhere.
- The emulator and cover art are fetched from their servers, so those need an internet connection.
- Add a console: one line in `systems.js`. Add or edit built-in games: `games.js`.
- Bring your own games. This project doesn't include any.
