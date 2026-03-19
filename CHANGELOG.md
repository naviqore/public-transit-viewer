# Changelog

## [2.0.0](https://github.com/naviqore/public-transit-viewer/compare/v1.0.0...v2.0.0) (2026-03-19)


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


### Bug Fixes

* **ci:** realign coverage thresholds and enforce them in pre-commit ([76f2bb4](https://github.com/naviqore/public-transit-viewer/commit/76f2bb4203cf4e93f6b4bd4a95b30fa708fa3a14))
* **ci:** unify quality gate and fix timezone-sensitive test ([987cdea](https://github.com/naviqore/public-transit-viewer/commit/987cdea2ec9187244ad600186b818bad607221fe))
* **isoline:** align list card travel time with map marker tooltip ([9a3c71a](https://github.com/naviqore/public-transit-viewer/commit/9a3c71a6d410d985f29f0d066c9486c9cda86745))
* **isolinepage:** resolve CSS import error and missing useEffect deps ([e1912a3](https://github.com/naviqore/public-transit-viewer/commit/e1912a3cec4d6c7f8022b288e0b48299131ccdd4))
* **pages:** cancel stale fetch responses on dep change ([6665abe](https://github.com/naviqore/public-transit-viewer/commit/6665abeaeb0c0bd1827cac9d969d6bd0fdf93eaa))
* **toast:** improve error toast messages and auto-dismiss duration ([5651350](https://github.com/naviqore/public-transit-viewer/commit/56513505494665403702a93f91cde7f41080cb30))
* **ui:** move tailwind config to repo and restore theme consistency ([6349ef6](https://github.com/naviqore/public-transit-viewer/commit/6349ef6e32ec9a78f15363312ad8b9053c04dace))


### Performance Improvements

* **pages:** memoize updateState helpers with useCallback ([c43585a](https://github.com/naviqore/public-transit-viewer/commit/c43585a1e7c7dc700f314afb070bc5b276eaba97))


### Miscellaneous Chores

* setup vite app with agentic workflow ([d47240f](https://github.com/naviqore/public-transit-viewer/commit/d47240f128d6e356c97d2cbf818b48e132d90c64))
* setup vite app with agentic workflow ([d47240f](https://github.com/naviqore/public-transit-viewer/commit/d47240f128d6e356c97d2cbf818b48e132d90c64))
