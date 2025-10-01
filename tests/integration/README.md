# Integration Test Fixtures

These tests generate temporary image files using `sharp` so the suite stays self-contained. No binary assets are stored in the repo.

To experiment with real photographs or scans, drop them into `tests/integration/fixtures` and update `createSampleImage` in `conversion.e2e.spec.ts` to load from disk.
