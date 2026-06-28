Status: ready-for-agent

# 13 — Push notifications + settings

## Parent

`.scratch/kanji-no-niwa/PRD.md`

## What to build

Web Push notifications delivered twice daily via Supabase Edge Functions, and a `/settings` page that lets learners control their pace, notification frequency, and audio preferences.

## Before starting

Nothing to download or author. The notification message content pool was seeded in Slice 8 (`batch-content-pool.ts` → `content` table). All assets are already in place.

## What to build (continued)

**Web Push subscription:**

On first authenticated dashboard load (or from `/settings`), the app prompts for notification permission. On grant, a Web Push subscription is created via the browser Push API and stored in `push_subscriptions` (id, user_id, endpoint, p256dh, auth, created_at). On deny, permission is recorded and the prompt does not re-appear unless the user toggles notifications on in `/settings`.

**Push notification Edge Functions:**

Two Supabase Edge Functions on cron triggers: one at 10:55, one at 18:55 (UTC+offset based on user preference, defaulting to UTC+1 for Henri's timezone). Each function:

1. Fetches all users with `notification_frequency ≥ 1` (for the 10:55 send) or `notification_frequency = 2` (for the 18:55 send).
2. For each user, selects a notification format weighted 60% / 25% / 15%:
   - **Kanji recall** (60%): picks a due kanji card for that day. Notification body: the kanji character + "What does this mean?" or "How do you read this?" (alternating). The kanji is displayed directly — no blur.
   - **Progression tease** (25%): "You're [N] kanji away from [next trainer rank name]" or "You're [N] kanji away from unlocking [closest locked text title]". Computed from live user stats.
   - **Fukuda message** (15%): picks a random entry from the `content` table where `type = 'notification'`.
3. Sends via Web Push API (VAPID). All notification formats deep-link to `/study` on tap.

**`/settings` page:**

Six controls:

1. **Daily lesson limit** — number input, default 10, min 0, max 30. Stored on `users.daily_lesson_limit`. Affects `getLessonQueue` and word card daily cap (2× this value, min 10 if set to 0).
2. **Notification frequency** — segmented control: Off (0) / Once a day (1) / Twice a day (2). Stored on `users.notification_frequency`.
3. **Notification permission** — if browser permission is denied, shows a note explaining how to re-enable in browser settings. If granted, shows "Active" badge.
4. **Background music** — toggle. Stored in `localStorage` as `mute_music`. Read by the `useAudio` hook in Slice 7.
5. **Sound effects** — toggle. Stored in `localStorage` as `mute_sfx`. Read by the `useAudio` hook.
6. **Sign out** — calls Supabase `signOut()`, redirects to sign-in page.

## Acceptance criteria

- [ ] `push_subscriptions` table: (id, user_id, endpoint, p256dh, auth, created_at).
- [ ] `users` table has: `daily_lesson_limit int default 10`, `notification_frequency int default 2`.
- [ ] Web Push subscription flow: permission prompt on first dashboard load, subscription stored in `push_subscriptions`.
- [ ] Two Supabase Edge Functions created and scheduled (10:55 and 18:55 cron). Functions are individually deployable via `supabase functions deploy`.
- [ ] Notification format selection: 60% kanji recall / 25% progression tease / 15% Fukuda message, weighted random.
- [ ] Kanji recall notification: shows the kanji character directly in the notification body.
- [ ] All three formats deep-link to `/study` on tap (notification `data.url = '/study'`).
- [ ] Notifications respect `notification_frequency`: 0 = never, 1 = 10:55 only, 2 = both sends.
- [ ] `/settings` page renders all six controls with current user values pre-populated.
- [ ] Daily lesson limit change: saved to `users.daily_lesson_limit`; reflected immediately in dashboard "new kanji today" counter and `getLessonQueue`.
- [ ] Notification frequency change: saved to `users.notification_frequency`; reflected in next Edge Function run.
- [ ] Music and SFX toggles write to `localStorage`; `useAudio` hook respects them immediately without page reload.
- [ ] Sign out: session cleared, redirect to `/` (unauthenticated sign-in page).
- [ ] Settings link accessible from navigation or user menu.
- [ ] VAPID keys documented in `.env.example` with instructions for generating them (`npx web-push generate-vapid-keys`).

## Blocked by

- Issue #06 (user settings row, dashboard Action zone for daily lesson limit)
