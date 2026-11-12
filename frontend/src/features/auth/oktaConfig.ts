import { OktaAuth } from '@okta/okta-auth-js'
import { env } from '../../lib/env'

/**
 * Authorization Code flow with PKCE (no client secret). Tokens are kept in memory,
 * not localStorage, and renewed with refresh tokens (offline_access scope).
 */
export const oktaAuth = new OktaAuth({
  issuer: env.oktaIssuer,
  clientId: env.oktaClientId,
  redirectUri: `${window.location.origin}/login/callback`,
  postLogoutRedirectUri: window.location.origin,
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  pkce: true,
  tokenManager: { storage: 'memory' },
})
