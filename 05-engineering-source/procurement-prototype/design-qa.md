# Semantic Role Navigation Design QA

- Reference: `C:\Users\Steven Yang\.codex\generated_images\019ff99b-da69-7320-a757-01b5be6f1427\exec-38d6d1c0-8bab-4a0d-b7a5-19815b6a5552.png`
- Implementation: `C:\Users\Steven Yang\.codex\visualizations\2026\08\13\019ff99b-da69-7320-a757-01b5be6f1427\semantic-navigation-qa\om-purchasing-desktop-final.png`
- Comparison: `C:\Users\Steven Yang\.codex\visualizations\2026\08\13\019ff99b-da69-7320-a757-01b5be6f1427\semantic-navigation-qa\mock-vs-implementation.png`
- Desktop viewport: 1440 x 1024, 1x density
- Narrow viewport: 820 x 900, 1x density
- State: OM Purchasing / Giang / My Intake

## Findings

- Information architecture matches the approved direction: role workflow is on the left; project, owner, currency, rate, and other contextual controls remain above the working data.
- Moved workflow names appear once. The legacy top navigation remains only as an internal event source and is not visible.
- The implementation is intentionally denser than the reference, per approval: smaller header, tighter controls, compact summary cards, and unchanged Excel-like tables.
- OM workflow order is `My Intake`, `My Quote Result`, `Quotation DB`, `OM Handoff`, followed by `Demand Progress Tracking` under Visibility.
- At 820 px the sidebar becomes a horizontal, scrollable workflow strip; the working table remains horizontally scrollable instead of being reformatted.
- Full-page comparison was sufficient because the changed region is the global shell and navigation rather than a small isolated component.
- Browser console after desktop and narrow checks: no errors or warnings.

## Fix history

- Initial rendered QA found `escapeHtml is not defined`, which interrupted login and sidebar rendering.
- Root cause: the new renderer referenced a helper name not defined by this project.
- Fix: use the existing `htmlText` and `htmlAttr` helpers, protected by a regression contract test.

## Result

passed
