import { toRelativeUrl, type OktaAuth } from '@okta/okta-auth-js'
import { Security } from '@okta/okta-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AccountsPage } from './features/accounts/AccountsPage'
import { CallbackPage } from './features/auth/CallbackPage'
import { oktaAuth } from './features/auth/oktaConfig'
import { RequireAuth } from './features/auth/RequireAuth'
import { TransactionsPage } from './features/transactions/TransactionsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function AppRoutes() {
  const navigate = useNavigate()
  const restoreOriginalUri = async (_auth: OktaAuth, originalUri: string) => {
    void navigate(toRelativeUrl(originalUri || '/', window.location.origin), { replace: true })
  }

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <Routes>
        <Route path="/login/callback" element={<CallbackPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/transactions" replace />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Security>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
