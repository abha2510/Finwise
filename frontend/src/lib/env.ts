function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`)
  }
  return value
}

export const env = {
  oktaIssuer: required('VITE_OKTA_ISSUER', import.meta.env.VITE_OKTA_ISSUER),
  oktaClientId: required('VITE_OKTA_CLIENT_ID', import.meta.env.VITE_OKTA_CLIENT_ID),
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
}
