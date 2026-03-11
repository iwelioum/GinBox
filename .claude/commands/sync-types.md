---
description: Synchronize TypeScript types with Rust models and database schema
---

Use the **atlas** subagent to:

1. Read `sokoul-backend/src/models.rs` — extract all struct definitions
2. Read `shared/types/index.ts` — extract all type/interface definitions
3. Compare field-by-field:
   - Missing fields in TS → add them
   - Missing fields in Rust → flag for review (do NOT auto-add)
   - Type mismatches → fix TS to match Rust (**Rust is source of truth**)
4. Check `sokoul-backend/migrations/` — verify latest migration matches `models.rs`
5. If `models.rs` has fields not in latest migration → propose a **new** migration file (never edit existing ones)

Report all changes and update `docs/DECISIONS.md` if any structural decisions were made.
After sync, use **oracle** to verify no existing tests are broken by the type changes.
