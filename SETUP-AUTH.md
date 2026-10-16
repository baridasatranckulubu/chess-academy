# Chess Academy v0.8 authentication setup

1. Create a Supabase project at https://supabase.com and keep the database password private.
2. In Supabase SQL Editor, execute `supabase-schema.sql` **on a new project**. It creates a protected profiles table and signup trigger.
3. In Supabase Auth settings, enable email confirmation, rate limiting and CAPTCHA; configure a production SMTP sender. Add your Netlify domain to Site URL and allowed redirect URLs.
4. Edit `auth-config.js`: set `supabaseUrl` and the **public anon/publishable key**. Never put a service-role/secret key in the browser.
5. Upload the entire updated directory to the same Netlify site. Signups and email login will now connect to Supabase.
6. Before collecting real child data: obtain qualified KVKK/GDPR legal review, implement verifiable parent consent/age controls, privacy notice and deletion/export workflows. Keep public registrations closed until then.
7. Teacher requests start with student privileges. Approve verified teachers manually in Supabase SQL Editor using the documented update query. Never approve based only on client-submitted role.

## Limitations
- Login uses **email + password**, while username is registered and unique in database. Username/password login needs a separate rate-limited server endpoint and is NOT implemented.
- The existing student/parent/coach dashboards remain demo content and are NOT protected, personalized or linked to accounts.
- No password reset, email notification or teacher approval workflow in the UI yet.
- The client holds access tokens only in memory; page refresh signs out. No secure cross-device session persistence yet.
- User-entered address and phone are optional; never request these from students. The public signup is not suitable for children until parent-consent verification exists.

## v0.9 notes
- Once configured, login fetches `profiles` via `/rest/v1` with the authenticated user's JWT; RLS restricts access to own profile. A failed profile fetch fails closed: no role-based dashboard shortcut.
- Password recovery is user-triggered, uses Supabase Auth `/recover`, and requires properly configured Site URL/email settings. This project does not process the recovery callback/change-password form yet.
- Students who indicate under 18 cannot sign up until a verifiable guardian-consent workflow is implemented. Age selection is self-reported and does not verify adulthood.
- No live accounts were created, no real email sent and no database migrations applied by this release.

- v0.9 signup trigger now requires `age_group='adult'` metadata. This is only a self-declaration and can be falsified. It is not verified age/guardian consent. Existing projects require a reviewed trigger migration before using the new client.

## v0.10 cloud progress setup
1. Run `supabase-progress-v10.sql` after the base schema in Supabase SQL Editor.
2. Configure `auth-config.js` with Supabase project URL and **public anon/publishable** key only.
3. Upload the whole v0.10 directory to Netlify.
4. Log in as an adult test account; visit Account and use Cloud Save / Cloud Restore.
5. Cloud sync is manual. A restore replaces this device's local demo progress after confirmation.
6. No actual Supabase account, project or live deployment was accessed in this release.
