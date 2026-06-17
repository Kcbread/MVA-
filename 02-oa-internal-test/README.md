# OA Internal Test Entry

Use this folder for internal UAT / OA-side test coordination.

## Current QA Entry

- App URL: `http://10.239.185.208:8080/`
- Health check: `http://10.239.185.208:8080/api/health`
- Last verified in this workspace thread: `2026-06-17`, real `curl` returned `{"ok":true,"db":"mysql"}`.

## Test Documents

| Purpose | File |
| --- | --- |
| Internal test plan | `docs/om-group-internal-test-plan-zhTW.md` |
| UAT scenarios | `docs/uat-test-cases-en.md` |
| Screen guide | `docs/ui-screen-guide-en.md` |
| Mac mini no-source demo access | `docs/MAC_MINI_IT_DEMO_ACCESS_NO_SOURCE_zhTW.md` |

## Notes

- This folder is for tester-facing entry and test coordination.
- Product truth remains in `../05-engineering-source/procurement-prototype/_context/`.
- IT implementation handoff lives in `../03-it-handoff/`.
