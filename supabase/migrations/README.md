# Migrations

Apply in order. Two options:

**Supabase Studio** — open the SQL editor, paste `0001_init.sql`, run it.

**Supabase CLI**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

After the first migration, create your own staff account:

1. Create a user in Authentication → Users.
2. Insert the matching profile row:

```sql
insert into public.profiles (id, email, full_name, role)
values ('<auth-user-uuid>', 'you@example.com', 'Your Name', 'admin');
```

Without a `profiles` row, a signed-in user is **not** staff and cannot reach `/admin`.
