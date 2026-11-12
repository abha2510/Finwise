import { toRelativeUrl } from '@okta/okta-auth-js'
import { useOktaAuth } from '@okta/okta-react'
import { useEffect } from 'react'
import Spinner from 'react-bootstrap/Spinner'
import { Outlet } from 'react-router-dom'

/** Protected-route guard: unauthenticated visitors are sent to Okta's hosted sign-in page. */
export function RequireAuth() {
  const { oktaAuth, authState } = useOktaAuth()

  useEffect(() => {
    if (!authState || authState.isAuthenticated) return
    oktaAuth.setOriginalUri(toRelativeUrl(window.location.href, window.location.origin))
    void oktaAuth.signInWithRedirect()
  }, [authState, oktaAuth])

  if (!authState?.isAuthenticated) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Signing you in…</span>
        </Spinner>
      </div>
    )
  }
  return <Outlet />
}
