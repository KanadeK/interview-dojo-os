# Release Checklist

- [ ] `npm ci` uses the committed lockfile.
- [ ] `npm run verify`, `npm run package`, `npm run demo`, and `npm run release-check` pass.
- [ ] `dist-release/` contains package output and `SHA256SUMS.txt`.
- [ ] A clean temporary directory can start the packaged Node application.
- [ ] No `.env`, database, cache or personal data is inside a release asset.
- [ ] `git status --short` is clean and version strings are v0.1.0.
- [ ] Git author and committer match the authenticated GitHub identity; no `Co-authored-by` trailer exists.
- [ ] GitHub Actions is green before tagging and the release assets match the local checksums.
