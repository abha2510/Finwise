# Okta setup

FinWise delegates sign-up, sign-in, password reset and MFA to Okta. The React app uses the
Authorization Code flow with PKCE (no client secret); the Spring Boot API validates the access
token as an OAuth 2.0 resource server.

Okta's console wording and free-plan limits change, so check the current Okta developer docs if a
menu name below does not match.

## 1. Create an org
Sign up for an Okta developer org. Note your org URL, e.g. `https://dev-123456.okta.com`.

## 2. Authorization server (audience and scopes)
Security → API → Authorization Servers. You can use the built-in `default` server or create a
custom one called `FinWise`.

- **Audience:** `api://finwise`
- **Scopes:** `openid`, `profile`, `email`, `offline_access`
- **Issuer URI:** shown on the server's Settings tab, e.g. `https://dev-123456.okta.com/oauth2/default`.
  This is `OKTA_ISSUER`.

Add an **access policy** and **rule** that allows the SPA app (step 3) to use the Authorization Code
grant and to request those scopes. Set a short access-token lifetime (for example 15 to 60 minutes).

### Put `email` in the access token
The backend reads the `sub` and `email` claims from the **access token**. Under the server's
Claims tab, add a claim:

- Name: `email`
- Include in token type: **Access Token**, Always
- Value type: Expression, value: `user.email`

Without this the app still works (users are keyed by `sub`), but the email will be blank.

## 3. Register the SPA
Applications → Create App Integration → **OIDC – OpenID Connect** → **Single-Page Application**.

| Setting | Value |
|---|---|
| Grant type | Authorization Code (PKCE is automatic for SPAs) |
| Also enable | Refresh Token |
| Sign-in redirect URI | `http://localhost:5173/login/callback` |
| Sign-out redirect URI | `http://localhost:5173` |
| Controlled access | Allow everyone (or your choice) |

Then:
- **Enable refresh-token rotation** (app → General → Refresh Token section).
- **Trusted Origins** (Security → API → Trusted Origins): add `http://localhost:5173` for **CORS** and
  **Redirect**. Use exact matches only; no wildcards.
- Copy the **Client ID**. This is `OKTA_CLIENT_ID`.

For production, register your real HTTPS origin and redirect URIs as additional exact entries.

## 4. Configure FinWise
```bash
cp .env.example .env
# fill in OKTA_ISSUER, OKTA_CLIENT_ID, OKTA_AUDIENCE, POSTGRES_PASSWORD

cp frontend/.env.example frontend/.env.local
# fill in VITE_OKTA_ISSUER and VITE_OKTA_CLIENT_ID (public values, no secrets)
```

| Variable | Used by | Example |
|---|---|---|
| `OKTA_ISSUER` | backend, docker compose | `https://dev-123456.okta.com/oauth2/default` |
| `OKTA_CLIENT_ID` | docker compose (frontend build) | `0oa...` |
| `OKTA_AUDIENCE` | backend | `api://finwise` |

## 5. Troubleshooting
- **401 on every API call:** the token's `iss` or `aud` does not match `OKTA_ISSUER` / `OKTA_AUDIENCE`.
  Paste the access token into a JWT decoder (use a throwaway dev account, never real data) and compare.
- **Redirect loop or "redirect URI mismatch":** the URI in Okta must match `http://localhost:5173/login/callback` exactly.
- **CORS error in the browser:** add the origin under Trusted Origins and make sure `FRONTEND_ORIGIN` matches.
- **Signed out on page refresh:** expected. Tokens live in memory only, so a reload silently re-authenticates through Okta's session.

## Later: account deletion (Week 6)
`DELETE /me` will also deactivate the Okta user using a separate **machine-to-machine** app with a
narrowly scoped Management API permission. That credential stays server-side only and is not needed yet.
