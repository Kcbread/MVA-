# UI baseline — 2026-10-07

The user authorizes Git/GitHub backup and rollback, superseding the earlier NO GIT rule for this purpose. Backend migration must preserve the existing frontend tables, columns, density, calculations and behavior. No UI redesign is authorized.

Primary baseline: 05-engineering-source/procurement-prototype (September updates).
Secondary baseline: ui-protection/Aug13 (copy of the external August static demo).

Backup branch: backup/ui-baseline-20261007
Backup tag: ui-baseline-20261007

Check: node ui-protection/check.cjs

The manifest pins current frontend bytes. Any intentional frontend change requires user approval, visual regression verification and a separately reviewed manifest update. The check is a drift alarm, not an access control; repository rules must require it for merge protection.

Safe recovery: clone the GitHub repository into a NEW directory and check out the baseline tag. Verify the manifest there before selectively restoring files. Do not reset/clean the current dirty workspace. Database, uploads and browser localStorage need separate backups and are not restored by Git.

This is a preservation snapshot, not a tested release. Historical test failures remain documented. Existing deploy workflows contain historical Git-based instructions; no deployment is requested or performed.
