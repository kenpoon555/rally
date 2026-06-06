# Beta feedback module (design + implementation)

**Last updated:** 2026-06-03  
**Status:** Shipped in app + migration `033_host_transfer_feedback.sql`

---

## Purpose

Collect **short text notes** during closed beta without email friction. Notes are stored in Postgres for founder review in **Admin**.

---

## User experience

| Element | Copy / behavior |
|---------|-----------------|
| Entry | Profile → **Send feedback** |
| Title | Beta feedback |
| Hint | When Rally **v1** launches, we plan **Founding Member** access for **at least two** especially helpful beta contributors (not every note qualifies) |
| Input | Multiline, 1–4000 chars |
| Submit | **Send feedback** → thank-you alert → back |

Optional route params: `screen`, `activityId` (for future “feedback from game room”).

---

## Data model

```sql
product_feedback (
  id uuid PK,
  user_id uuid → profiles,
  body text NOT NULL,
  screen text NULL,
  activity_id uuid NULL → activities,
  created_at timestamptz
)
```

**RPCs:**
- `submit_product_feedback(body, screen?, activity_id?)` — any authenticated user
- `admin_list_product_feedback(limit)` — `profiles.is_admin` only

**RLS:** users insert/read own; admins read all.

---

## Founder review

**Admin app screen** — section **Beta feedback** (newest first, 30 rows).

**Week 2 SQL** (Supabase SQL editor):

```sql
select f.created_at, p.username, f.screen, left(f.body, 200) as preview
from product_feedback f
join profiles p on p.id = f.user_id
order by f.created_at desc
limit 50;
```

Tag notes in a spreadsheet: `bug | ux | feature | praise` — award Founding Member manually after launch (no auto-grant in v1).

---

## Apply migration

```bash
cd RallyApp
supabase db query -f supabase/migrations/033_host_transfer_feedback.sql --linked
```

---

## Not in v1

- Attachments / screenshots
- Upvotes on others’ feedback
- In-app “your feedback status”
- Auto-grant entitlements from feedback
