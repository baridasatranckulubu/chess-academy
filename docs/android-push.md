# Android push notifications

Firebase project: `barida-satranc`; package: `com.baridasatranckulubu.academy`.

The client registers a device token after a verified academy login and requests Android notification permission. A notification tap opens the academy, waits for login, and verifies the notification recipient in the database before selecting a route. Signing out removes this account's device registration and delivered tray notifications.

The Android public configuration lives in `native/android/google-services.json`. The private service account remains exclusively in Supabase Edge Function secret `FIREBASE_SERVICE_ACCOUNT`; never add it to this repository, bundled web assets, APK or logs.

The deployed `academy-push-dispatch` function authenticates requests with a dedicated server-only key. `database/android-push-devices.sql` and `database/android-push-dispatch.sql` were applied together as `android_push_notification_delivery`. New `academy_notifications` rows enqueue deliveries for currently registered recipients. A database trigger immediately wakes the worker; Cron retries temporary failures every minute with backoff. Claims use leases and SKIP LOCKED. FCM notification tags use notification UUIDs to replace duplicate tray entries if a request is retried. Delivery is at least once, not exactly once.

Private payment categories remain restricted to admins; inactive student accounts and notifications already read are excluded. Device tokens and worker RPCs cannot be read or invoked by other users. Retention: jobs 7 days, devices 90 days. Notification TTL: 24 hours.

Verified:
- Google OAuth service-account authentication returned HTTP 200 without revealing secrets.
- Transactional database test registered a device as authenticated and enqueued exactly one delivery; transaction rolled back and sent nothing.
- Worker RPC access denied to anon/authenticated; device RLS enabled.
- Native push routing tests: valid recipient, wrong account, signed out, invalid notification ID.
- Existing mobile integration checks passed; generated Capacitor project detects the native FCM plugin.

Pending: publish reviewed application changes, run Android APK build/instrumentation, install update on a real device, sign in, grant notification permission, assign homework from another device while the recipient app is closed, and test the notification tap. No claim of real-device closed-app delivery is made until that test passes. Android force-stop and disabled notification permissions can prevent delivery.
