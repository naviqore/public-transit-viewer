# Changelog

## [2.0.1](https://github.com/naviqore/public-transit-viewer/compare/v2.0.0...v2.0.1) (2026-04-02)


### Bug Fixes

* **settings:** lock mock settings when controlled by mode or environment ([744bfc3](https://github.com/naviqore/public-transit-viewer/commit/744bfc3415ae1171c3e59863424e9774ef787095))
* **ui:** use base-path-aware logo URL for GitHub Pages deployment ([e5aec07](https://github.com/naviqore/public-transit-viewer/commit/e5aec070d95f4021664dec2b9a45e3dad5d587ae))

## [2.0.0](https://github.com/naviqore/public-transit-viewer/compare/v1.0.0...v2.0.0) (2026-04-02)


### ⚠ BREAKING CHANGES

* setup vite app with agentic workflow
* setup vite app with agentic workflow

### Features

* **benchmark:** replace custom scenario tooltip with Floating UI ([845ecb7](https://github.com/naviqore/public-transit-viewer/commit/845ecb76600d1cc6fa02fac11b4a9445ddfb3fd0))
* **dialogs:** replace modal shell with responsive fullscreen on mobile ([2c4389b](https://github.com/naviqore/public-transit-viewer/commit/2c4389b9d2207cae30e09e48d9bd76f4d7d42041))
* **docker:** add production Dockerfile, nginx config, and CI/CD pipeline ([bad0b14](https://github.com/naviqore/public-transit-viewer/commit/bad0b1425848c2c812a7e3fa944e6023556fe0d3))
* **docker:** support runtime env vars via window.__ENV__ injection ([39e68a9](https://github.com/naviqore/public-transit-viewer/commit/39e68a935c392bf0de545b018148d941e47db46c))
* **domain:** add backendStatus indicator with error badges and About dialog states ([75c5b44](https://github.com/naviqore/public-transit-viewer/commit/75c5b4452f9deae5b550f4434e5ec5e98d7720aa))
* **html:** rename browser tab title to "Naviqore | Public Transit Viewer" ([ed2f63c](https://github.com/naviqore/public-transit-viewer/commit/ed2f63cf211333e29c8b3e1ab5ef852835205a55))
* **isoline:** add travel-time / transfers color-mode toggle ([8a03684](https://github.com/naviqore/public-transit-viewer/commit/8a03684ef17becf048653a2921d1d6595daf01aa))
* **pages:** skip redundant backend queries on page switch ([78ea14d](https://github.com/naviqore/public-transit-viewer/commit/78ea14dae575b9965ca58f031e5bec4d474ef72c))
* **services:** improve provider error result model and propagate ProblemDetail metadata ([db6a693](https://github.com/naviqore/public-transit-viewer/commit/db6a6937db65a591f07d8ca06ab8be16b6e29891))
* **ui:** show staleness indicator for cached query results ([6f1105a](https://github.com/naviqore/public-transit-viewer/commit/6f1105a5d6366ee55dbd9c5a7233f72173dd54be))


### Bug Fixes

* **benchmark:** make benchmark seed stops backend-agnostic ([577b670](https://github.com/naviqore/public-transit-viewer/commit/577b6707aca1d8b3bc1c175fdd2f2466f00e1a9d))
* **benchmark:** persist benchmark state across tab and page navigation ([20a508b](https://github.com/naviqore/public-transit-viewer/commit/20a508be5c6c7e48772b7c7c737f3d630325c0df))
* **benchmark:** replace dynamic Tailwind classes with static lookup map ([1a9f8b8](https://github.com/naviqore/public-transit-viewer/commit/1a9f8b8cc0fdff2bafd414777a2ae54645a9931d))
* **ci:** realign coverage thresholds and enforce them in pre-commit ([76f2bb4](https://github.com/naviqore/public-transit-viewer/commit/76f2bb4203cf4e93f6b4bd4a95b30fa708fa3a14))
* **ci:** unify quality gate and fix timezone-sensitive test ([987cdea](https://github.com/naviqore/public-transit-viewer/commit/987cdea2ec9187244ad600186b818bad607221fe))
* **isoline:** align list card travel time with map marker tooltip ([9a3c71a](https://github.com/naviqore/public-transit-viewer/commit/9a3c71a6d410d985f29f0d066c9486c9cda86745))
* **isolinepage:** resolve CSS import error and missing useEffect deps ([e1912a3](https://github.com/naviqore/public-transit-viewer/commit/e1912a3cec4d6c7f8022b288e0b48299131ccdd4))
* **map:** stabilize Leaflet lifecycle and resize handling ([b44e754](https://github.com/naviqore/public-transit-viewer/commit/b44e754eb8971a0aab427ae15a2fcf6976577e11))
* **map:** use formatDisplayTime for map popup timestamps ([875232b](https://github.com/naviqore/public-transit-viewer/commit/875232bbcc09914a19746029cc02071e29e34d6d))
* **pages:** cancel stale fetch responses on dep change ([6665abe](https://github.com/naviqore/public-transit-viewer/commit/6665abeaeb0c0bd1827cac9d969d6bd0fdf93eaa))
* **service:** surface non-404 autocomplete errors ([dcad1e1](https://github.com/naviqore/public-transit-viewer/commit/dcad1e19aba73d23b1c10826974e3853d89e27a5))
* **toast:** improve error toast messages and auto-dismiss duration ([5651350](https://github.com/naviqore/public-transit-viewer/commit/56513505494665403702a93f91cde7f41080cb30))
* **ui:** improve ErrorBoundary error surfacing and reset ([845d2a6](https://github.com/naviqore/public-transit-viewer/commit/845d2a6c5e3ff3e443068a7ea94a23fa1f5d04fb))
* **ui:** move tailwind config to repo and restore theme consistency ([6349ef6](https://github.com/naviqore/public-transit-viewer/commit/6349ef6e32ec9a78f15363312ad8b9053c04dace))


### Performance Improvements

* **map:** optimise isoline rendering with Canvas, viewport culling, and lazy tooltips ([99eb184](https://github.com/naviqore/public-transit-viewer/commit/99eb184f89dbfc32c1aa5464afabb39bfb33cc98))
* **pages:** memoize updateState helpers with useCallback ([c43585a](https://github.com/naviqore/public-transit-viewer/commit/c43585a1e7c7dc700f314afb070bc5b276eaba97))


### Miscellaneous Chores

* setup vite app with agentic workflow ([d47240f](https://github.com/naviqore/public-transit-viewer/commit/d47240f128d6e356c97d2cbf818b48e132d90c64))
* setup vite app with agentic workflow ([d47240f](https://github.com/naviqore/public-transit-viewer/commit/d47240f128d6e356c97d2cbf818b48e132d90c64))
