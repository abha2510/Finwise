import axios, { AxiosError } from 'axios'
import { oktaAuth } from '../features/auth/oktaConfig'
import { env } from '../lib/env'
import type { ApiError } from '../types'

export const api = axios.create({ baseURL: env.apiUrl })

// Attach the Okta access token. getAccessToken() renews it when it is about to expire.
api.interceptors.request.use(async (config) => {
  const token = await oktaAuth.getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

// On 401 the session is gone or the token was rejected: sign in again.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      void oktaAuth.signInWithRedirect()
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const body = error.response?.data
    if (body?.details?.length) return `${body.message}: ${body.details.join('; ')}`
    if (body?.message) return body.message
    if (!error.response) return 'Cannot reach the server. Is the backend running?'
  }
  return 'Something went wrong. Please try again.'
}
