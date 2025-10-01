# Release Instructions

## Creating a New Release

Follow these steps to publish a new version:

### 1. Update Version

Update the version in `package.json`:

```bash
npm version patch  # for bug fixes (0.1.0 -> 0.1.1)
npm version minor  # for new features (0.1.0 -> 0.2.0)
npm version major  # for breaking changes (0.1.0 -> 1.0.0)
```

This will automatically:

- Update version in package.json and package-lock.json
- Create a git commit with the version bump
- Create a git tag (e.g., v0.1.1)

### 2. Push the Tag

```bash
git push origin main --tags
```

### 3. Automated Build

GitHub Actions will automatically:

- Build for Windows, macOS, and Linux
- Create a GitHub release with the tag name
- Upload all distributable files to the release

### 4. Monitor the Build

- Go to: https://github.com/munalgar/imgtopdf/actions
- Watch the "Release" workflow progress
- Builds typically take 10-15 minutes

### 5. Edit Release Notes (Optional)

Once the release is published:

1. Go to https://github.com/munalgar/imgtopdf/releases
2. Click "Edit" on the new release
3. Add release notes describing changes
4. Publish the updated release

## Release Artifacts

Each release will include:

**Windows**

- `imgtopdf-{version}-setup.exe` - NSIS installer

**macOS**

- `imgtopdf-{version}.dmg` - Disk image

**Linux**

- `imgtopdf-{version}.AppImage` - Portable executable
- `imgtopdf-{version}.deb` - Debian/Ubuntu package
- `imgtopdf-{version}.snap` - Snap package

## Manual Release (if needed)

If you need to build and release manually:

```bash
# Build for your current platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux

# Artifacts will be in the dist/ folder
```

## Troubleshooting

**Build fails on macOS**

- Ensure you have Xcode Command Line Tools installed
- Code signing is disabled by default (notarize: false)

**Build fails on Linux**

- Snap builds require `snapcraft` to be installed
- You can disable snap in electron-builder.yml if needed

**Release not created**

- Ensure the tag follows the format `v*.*.*` (e.g., v0.1.0)
- Check that GitHub Actions has write permissions
- Verify the GH_TOKEN secret is available
