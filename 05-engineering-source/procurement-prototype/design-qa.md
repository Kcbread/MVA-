**Findings**
- [P2] Source visual target is missing, so visual fidelity QA cannot be completed
  Location: Login screen / role dropdown.
  Evidence: implementation screenshot captured at `test-artifacts/design-qa/login-role-dropdown-server.png`; no Figma node, mockup, screenshot, or source visual target was provided for side-by-side comparison.
  Impact: I can verify behavior, layout health, and accessibility through tests, but cannot truthfully judge whether the rendered login screen matches an intended visual design.
  Fix: provide the source visual target if a formal Product Design visual QA pass is required.

**Open Questions**
- Should Buyer Handoff remain visible in the login role dropdown for all UAT testers, or should it be limited to a hidden/test-only mode later?

**Implementation Checklist**
- Server `/api/login` accepts `role` / `loginRole` for test-role session switching.
- Login dropdown stays enabled in API/server mode.
- Role changes auto-fill the matching test account.
- Buyer Handoff test user is available in server memory fallback.
- API and role-flow contracts cover the new behavior.

**Follow-up Polish**
- Add a small non-blocking helper text under Login role if testers need to understand that choosing a role will switch the server session account.

source visual truth path: unavailable
implementation screenshot path: `/Users/kai-chenyang/Desktop/Codex /資料庫建置/procurement-prototype/test-artifacts/design-qa/login-role-dropdown-server.png`
viewport: 1440x920
state: server-rendered login screen at `http://127.0.0.1:4173/`
full-view comparison evidence: blocked because no source visual target was provided
focused region comparison evidence: blocked because no source visual target was provided
patches made since previous QA pass: login dropdown now supports server role switching; Buyer Handoff option/user added; server API role mapping and tests added
final result: blocked
