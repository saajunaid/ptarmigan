# ptarmigan publishing notes

This extension is published to VS Code Marketplace under:
- **Publisher:** `junai-labs`
- **Extension ID:** `junai-labs.ptarmigan`

## Release checklist

1. Sync latest source-of-truth resources from `agent-sandbox`.
2. Confirm `Ptarmigan.png` is the active icon in `package.json`.
3. Update `README.md` and `CHANGELOG.md`.
4. Bump version in:
   - `package.json`
   - `package-lock.json`
5. Ensure PAT file exists at `ptarmigan.pat` (gitignored).
6. Run sync/publish flow.

## Publish flow (maintainer)

From `E:\Projects\agent-sandbox`:

- source `sync.ps1`
- run `sync-ptarmigan -ProjectRoot 'E:\Projects\agent-sandbox'`

Behavior:
- sync updates pool + extension artifacts in `vscode-extensions/ptarmigan`
- pushes repo changes
- if `package.json` changed in the sync commit, it triggers `vsce publish`

## Notes

- ptarmigan is the public marketplace lane.
- liffey is internal VSIX-only lane.
- Keep secrets out of source control (`*.pat`, `*.key` are ignored).
