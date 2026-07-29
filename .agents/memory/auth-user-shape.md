---
name: Auth user shape
description: AuthUser includes role/displayName/isProfileComplete; how they flow from DB through session to frontend
---

## Rule
When building a `SessionData.user` object (AuthUser), you must always include all five core fields PLUS the three extended fields:
- `role` — read from `dbUser.role ?? 'user'`, cast to `'user' | 'admin'`
- `displayName` — from `dbUser.name ?? null`
- `isProfileComplete` — from `dbUser.isProfileComplete ?? false`

This applies in both the web OIDC callback (`/api/callback`) and the mobile exchange endpoint.

## Why
`AuthUser` in the OpenAPI spec defines these as required. TypeScript raises TS2739 if they are omitted. `authMiddleware` re-fetches from DB for role freshness anyway, so the session values are overwritten on each request — but they must be present for the initial session write to type-check.

## How to apply
Any time `upsertUser(claims)` is called and the result is used to build a `SessionData`, add the three fields:
```ts
role: (dbUser.role ?? 'user') as 'user' | 'admin',
displayName: dbUser.name ?? null,
isProfileComplete: dbUser.isProfileComplete ?? false,
```
