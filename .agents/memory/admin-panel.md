---
name: Admin panel architecture
description: How the /admin route is structured and why routes must be ordered before the main Layout.
---

## Rule
Admin routes must be declared before the generic `<Route>` that wraps `<Layout>` in the wouter `<Switch>`. Wouter Switch renders the first match only, so /admin/* catches before the fallthrough Layout handler.

**Why:** If admin routes are placed inside the Layout Route, they get the main app's bottom nav and won't be able to have their own sidebar/top-bar layout.

**How to apply:** In App.tsx, the Switch order is:
1. /admin/dashboard, /admin/matches, /admin/news, /admin/predictions, /admin/users (each wrapped in AdminLayout with auth guard)
2. /admin (login page, no auth guard)
3. Fallthrough `<Route>` with `<Layout>` wrapping all main-app routes

## Auth
Passcode "admin123" checked client-side; `localStorage.setItem("admin_authed", "true")` on success. AdminLayout redirects to /admin if key is missing.
