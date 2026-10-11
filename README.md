# Luftborn eBay web automation

Playwright + TypeScript framework using the Page Object Model and external JSON test data.

## Requirements covered

Each scenario produces three independent test cases in the report:

1. **TC01 - Homepage:** Open https://www.ebay.com/ and verify the URL, title, logo and search controls.
2. **TC02 - Search before filtering:** Open the homepage, set the isolated test session shipping destination from JSON, then search for `mazda mx-5`, verify the query, results heading and visible listings, and log the total reported by eBay and number of listings on the page. Rounded totals are labelled as lower bounds.
3. **TC03 - Results after filtering:** Open the homepage, set the destination and search, then click `Transmission` > `Manual` in the left sidebar, verify the checked checkbox and URL refinement, and require visible results and a positive count.

There is no URL or dialog fallback for step 3. If eBay does not offer that sidebar control, the test fails instead of claiming to have completed the required interaction. Counts before/after are logged but not compared as a fixed invariant: live inventory and approximate counts can change.

## Setup and execution

Use a current Node.js LTS version compatible with the dependencies (Node 24 recommended).

```powershell
npm.cmd ci
npm.cmd run setup:browsers
npm.cmd run typecheck
npm.cmd run test:checks
npm.cmd run test:headless
npm.cmd run test:headed
npm.cmd run report
```

On Windows, `npm.cmd` avoids PowerShell's disabled-script-policy error. Other shells can use `npm`.
Browsers and the video encoder are installed in the project-local `.playwright` directory, excluded from source control and the submission ZIP.

Configuration: `HEADLESS=true` runs headless (default is headed); `SLOW_MO` controls action delay (300 ms headed, zero headless); `BROWSER_CHANNEL` selects `chromium` (default), `chrome` or `msedge`; `PROXY_SERVER` optionally supplies an authorized proxy. Installed Chrome/Edge still require the Playwright video encoder from setup.

The supplied test destination is United States / 10001. The live diagnostic showed that Egypt shipping returned parts/accessories without Transmission; selecting the US destination through the ordinary shipping dialog exposed vehicle listings and that filter. This changes only the fresh anonymous test session.

## Structure and extension

- `test-data/ebay-search.json`: URL, expected home title/URL, scenario names, search terms, minimum counts, shipping destination and filter values. Add a scenario to this file to add three test cases.
- `src/pages/BasePage.ts`: reusable navigation, clicking, typing, waits, screenshots and named reporting steps.
- `src/pages/HomePage.ts`: homepage controls and search behavior.
- `src/pages/SearchResultsPage.ts`: result counts and sidebar filter behavior.
- `src/fixtures.ts`: managed per-test page and shipping-dialog handler.
- `src/utils/`: test data loading and console/report logging.
- `tests/ebay-search.spec.ts`: business flow and assertions.
- `playwright.config.ts`: browser settings, HTML/JUnit reports, video, screenshots and traces.

Page objects encapsulate selectors and actions; tests own assertions. Each test case gets an isolated context managed by Playwright, ensuring cleanup and finalizing video on success or failure.

## Page Object Model and locator map

| Object | Locator ownership and behavior |
| --- | --- |
| `src/pages/HomePage.ts` | `logo`, `searchInput`, `searchButton`; opening the homepage and searching |
| `src/pages/SearchResultsPage.ts` | `resultCountHeading`, `resultItems`, `leftRail`; `filterGroup()`, `filterOption()` and `filterCheckbox()` for dynamic filters |
| `src/pages/components/ShippingDestination.ts` | Header location button, shipping dialog, close button, iframe country/postal fields and Confirm button; popup handling and destination selection |
| `src/pages/BasePage.ts` | Shared error-page locators, browser actions, screenshots and bounded recovery |
| `src/fixtures.ts` | Creates/injects the `homePage` page object and registers the shipping component handler |

The three scenario tests contain business assertions and calls to page objects; they do not define CSS selectors. Static locators are declared as named properties and initialized in constructors. Parameterized filter locators are methods on `SearchResultsPage`. `HomePage.search()` returns that page object. The compatibility popup utility delegates to the shipping component and contains no selectors.

## Reports and video evidence

Each run replaces the preceding generated report:

| Path | Contents |
| --- | --- |
| `reports/html/index.html` | Interactive report with named steps, logs and attachments |
| `reports/junit/results.xml` | Machine-readable pass/fail results |
| `reports/artifacts/` | Separate page video (`video.webm`) and trace per test case, plus failure screenshots |

Each test attaches a screenshot of the state it validates. TC03 records the complete homepage-to-filtered-results flow. Tests do not share state or depend on execution order; run any case alone with `npm.cmd run test:headless -- --grep TC03`. Video and trace are retained on successful and failed runs. See [Playwright video documentation](https://playwright.dev/docs/videos).

Playwright records page content from page creation to context closure. It does **not** record desktop/browser chrome or the visible browser process launching and closing. For the assignment's literal launch-to-close video, start a desktop screen recording before `npm.cmd run test:headed`, stop it after the browser closes, and place that recording in `reports/` before packaging. Do not submit a failed-run video as proof of a working flow.

The separate `test:checks` command runs an offline regression test for the shipping popup. It reproduces an overlay already blocking the location button, verifies destination selection and confirms the popup handler is restored. These framework checks are separate from the three live eBay cases.

## Troubleshooting

- Missing browser/FFmpeg: run `npm.cmd run setup:browsers`.
- Connection/download denied: allow access to the Playwright download host and eBay, then retry.
- eBay error page: The recorded TC03 failure occurred after clicking Manual: eBay repeatedly returned its "Something went wrong" page. Recovery time is not guaranteed. The framework reloads with bounded backoff (up to 3 minutes per page), then fails with a diagnostic. `BROWSER_CHANNEL=chrome` is available as an optional browser choice. A bot challenge fails explicitly; no bypass is attempted.
- Missing Transmission sidebar: inspect the screenshot/trace and the category/inventory eBay actually returned. Parts/accessories search results may not offer vehicle transmission filters. The framework must not manufacture a selected filter using URL parameters.
- Title/markup changes: inspect the report before updating external expectations or page object selectors.

## Publication and submission

Repository: https://github.com/paulan12/Luftborn-Automation (private). Grant your reviewer access before sharing the submission URL. Do not include dependencies, browser binaries or secrets in Git; `.gitignore` excludes generated output.

After obtaining a successful run and the full desktop recording, create the ZIP:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1 -RepositoryUrl https://github.com/paulan12/Luftborn-Automation
```

This creates `deliverables/Luftborn-Automation.zip` with source, lockfile, documentation, reports and recordings, excluding `node_modules` and browser binaries. `SUBMISSION-STATUS.txt` records the supplied repository URL. Without a URL it explicitly marks publication as pending. Check the JUnit report and recording before submission.
## Verified execution

On 2026-10-11, the POM refactor passed TypeScript checking, three offline framework checks (popup interception, transient server-error recovery, persistent-error failure), and all three live eBay test cases. TC02 reported 69 results. TC03 clicked Manual and verified 47 results from 69 before filtering. These are observed values, not fixed expectations. Each live case has a separate video and trace.

The earlier TC03 report showed repeated eBay error pages after the Manual click. The current bounded backoff allows recovery but cannot guarantee availability of the external site. Persistent errors still fail the test.

The source is published to the private paulan12 repository linked above. The literal desktop launch-to-close recording remains a separate submission step.
