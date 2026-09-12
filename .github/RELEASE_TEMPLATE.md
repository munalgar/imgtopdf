# Release Instructions

## Publish a new version

1. Commit the release workflow and application changes to `main`.
2. Update the version and create its tag:

   ```bash
   npm version patch
   git push origin main
   git push origin v1.0.7
   ```

   Replace `v1.0.7` with the tag printed by `npm version`. That command updates
   both package files and creates a commit and tag.

3. Watch the [Release workflow](https://github.com/munalgar/imgtopdf/actions/workflows/release.yml).
   It builds Windows, macOS, and Linux installers without publishing from the
   individual build jobs. After all three succeed, a separate job uploads the
   artifacts and publishes a public, stable GitHub release.
4. Check [Latest release](https://github.com/munalgar/imgtopdf/releases/latest).
   The README version badge requires a public release; a tag or draft alone
   does not satisfy it. Badge updates can take a few minutes to appear.

The tag must be `v` followed by the exact stable version in `package.json`.
For example, version `1.0.6` requires tag `v1.0.6`.

## First release of the current version

Version `1.0.6` is already recorded in the package files, but its tag has not
been pushed. After committing these workflow fixes, publish that version with:

```bash
git push origin main
git tag v1.0.6
git push origin v1.0.6
```

Create the tag on the commit containing the fixes. Do not move existing release
tags: rerunning an old tag-triggered run uses its old workflow.

## Retry an existing tag

Once this workflow is on `main`, open **Actions > Release > Run workflow**,
select `main`, and enter the existing tag (for example, `v1.0.6`). The workflow
checks out that tag's source while using the workflow selected for the manual
run. The tag must match the package version.

Retries reuse an existing draft or release and replace matching asset names.
New releases remain drafts until all uploads finish. Existing public releases
remain public during a retry.

## Release artifacts

- Windows: `imgtopdf-{version}-setup.exe`
- macOS: `imgtopdf-{version}.dmg` (and ZIP if generated)
- Linux: `imgtopdf-{version}.AppImage` and a Debian `.deb` package
- Associated update metadata and blockmaps, if generated

Snap packages are not built. Each platform packages its own native dependencies.
The workflow uses sharp's prebuilt binaries without installing system libvips
or FUSE packages. Signing identity discovery is disabled for these unsigned builds.

## Troubleshooting

- **Release badge is failing:** inspect the latest Release run, rather than the
  separate Build and Test workflow. A successful normal build does not update
  the Release badge.
- **No release or repo found:** confirm a public, stable release exists. Tags,
  drafts, and prereleases do not satisfy the stable-release badge.
- **Publish fails:** the publish job needs `contents: write`. It uses the
  automatic `GITHUB_TOKEN`; no personal token secret is required.
- **A platform build fails:** correct the error and retry. The publish job will
  not run unless every platform build succeeds.

For local installers, use `npm run build:win`, `npm run build:mac`, or
`npm run build:linux`. Output files are written to `dist/`.
