import { LoginCallback } from '@okta/okta-react'
import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import Spinner from 'react-bootstrap/Spinner'

/** Route for /login/callback: the SDK exchanges the code using PKCE. */
export function CallbackPage() {
  return (
    <LoginCallback
      loadingElement={
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Completing sign-in…</span>
          </Spinner>
        </div>
      }
      errorComponent={({ error }) => (
        <Container className="py-5">
          <Alert variant="danger">
            <Alert.Heading>Sign-in failed</Alert.Heading>
            <p className="mb-0">{error.message}</p>
          </Alert>
        </Container>
      )}
    />
  )
}
