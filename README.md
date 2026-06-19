# matta reader

a fork of [dark reader](https://github.com/darkreader/darkreader) that automatically imports colors from [matugen](https://github.com/InioX/matugen). firefox only.

## prerequisites

### matugen

you need matugen installed and a [matugen template](https://github.com/xo-xo-xo-xo/matta-reader/blob/main/templates/darkreader.json) that outputs a darkreader-compatible json. 

add this to your matugen config (`~/.config/matugen/config.toml`):

```toml
[templates.darkreader]
input_path = '~/.config/matugen/templates/darkreader.json'
output_path = '~/.config/matugen/output/darkreader.json'
```

run `matugen image <your-wallpaper>` and it'll generate the json file the extension reads from.

### native messaging host

the extension can't read local files directly (firefox sandbox), so there's a small python script that acts as a bridge. firefox spawns it on demand when you toggle "matugen sync" on.

save [darkreader-matugen-host](https://github.com/xo-xo-xo-xo/matta-reader/blob/main/scripts/darkreader-matugen-host) to ```~/local.bin```

make it executable:

```sh
chmod +x ~/.local/bin/darkreader-matugen-host
```

then create the native messaging manifest at `~/.mozilla/native-messaging-hosts/darkreader_matugen.json`:

```json
{
  "name": "darkreader_matugen",
  "description": "dark reader matugen integration",
  "path": "/home/youruser/.local/bin/darkreader-matugen-host",
  "type": "stdio",
  "allowed_extensions": ["darkreader-matugen@local"]
}
```

make sure the `path` points to where you put the host script. the `allowed_extensions` id must match the gecko id in `src/manifest-firefox.json`.

## building

```sh
npm install
npm run build
```

the extension lands in `build/release/firefox/`.

## installing

you have three options:

### option 1: temporary install (no account needed)

go to `about:debugging#/runtime/this-firefox` in firefox, click "load temporary add-on", and select `build/release/firefox/manifest.json`. this works on stable firefox but the extension disappears when you restart.

### option 2: signed install (permanent, needs AMO account)

create a free account at [addons.mozilla.org](https://addons.mozilla.org/), then generate API credentials at https://addons.mozilla.org/developers/. you'll get an api key and secret.

sign the extension:

```sh
WEB_EXT_API_KEY=yourkey WEB_EXT_API_SECRET=yoursecret npx web-ext sign --source-dir build/release/firefox
```

the signed xpi appears in `web-ext-artifacts/`. install it via `about:addons` -> gear icon -> "install add-on from file".

note: AMO rejects duplicate versions, so bump the version in `src/manifest.json` before each re-sign.

### option 3: use firefox developer edition/nightly

no need to sign addons on these.

## usage

open the matta reader popup from the toolbar, go to the **more** tab, and toggle **matugen sync** on. the extension connects to the native host, reads your matugen colors, and applies them. whenever matugen regenerates the file (e.g. you change your wallpaper), the extension picks it up automatically within 2 seconds.

the toggle state persists across firefox restarts. no autostart needed for the host.

## quirks

- firefox only. 
- the addon id is `darkreader-matugen@local`, so it won't conflict with the official dark reader.
- store locale listings were removed (they're for AMO store pages, not the extension itself). 42 non-english locale files are still bundled.
- donate buttons, anniversary nagging, and the help page redirect on install were all ripped out.
- if you change the gecko id in the manifest, update `allowed_extensions` in the native messaging manifest to match.
