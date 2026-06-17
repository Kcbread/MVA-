# DB Files

- `schema-current.sql`: current factual MySQL schema from the prototype.
- `seed-uat-users.sql`: current UAT user seed.
- Read `../02-it-handoff-en/05-database-current-and-target.md` before designing workflow persistence.

Do not use `mva_procurement_uat` for automated DB integration tests. Create an isolated test DB such as `mva_procurement_test`.
