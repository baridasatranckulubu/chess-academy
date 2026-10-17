# Chess Academy v0.36 integration plan

The GitHub main branch and the local full archive have diverged. Do not overwrite main.

Preserve main-only beginner lessons, premium board components, federation page and tests. Preserve local-only PWA, Capacitor assets, six-language lessons and newer puzzle tests.

Integrate both trees in a review branch and run Node, Chromium, localization, access-control and offline tests before merging.

The production release remains blocked until a real backend, verified guardian consent, database row-level security integration tests, HTTPS deployment, and Android/iOS device tests have passed.

This document does not authorize collecting children's personal data or describe a completed release.
