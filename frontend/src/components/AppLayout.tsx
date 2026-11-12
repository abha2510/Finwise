import { useOktaAuth } from '@okta/okta-react'
import { useEffect, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Nav from 'react-bootstrap/Nav'
import Navbar from 'react-bootstrap/Navbar'
import { NavLink, Outlet } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { useProfile } from '../features/accounts/hooks'

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('finwise-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppLayout() {
  const { oktaAuth } = useOktaAuth()
  const profile = useProfile() // first request after sign-in creates the local user
  const [theme, setTheme] = useState<Theme>(initialTheme)

  // Bootstrap color modes: data-bs-theme on <html>.
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    try {
      localStorage.setItem('finwise-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  return (
    <>
      <Navbar expand="md" className="bg-body-tertiary border-bottom mb-4">
        <Container>
          <Navbar.Brand as={NavLink} to="/">
            FinWise
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              <Nav.Link as={NavLink} to="/transactions">
                Transactions
              </Nav.Link>
              <Nav.Link as={NavLink} to="/accounts">
                Accounts
              </Nav.Link>
            </Nav>
            <div className="d-flex align-items-center gap-2">
              {profile.data?.email && <small className="text-body-secondary">{profile.data.email}</small>}
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </Button>
              <Button size="sm" variant="outline-primary" onClick={() => void oktaAuth.signOut()}>
                Sign out
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="pb-5">
        {profile.isError && <Alert variant="danger">{errorMessage(profile.error)}</Alert>}
        <Outlet />
      </Container>
    </>
  )
}
