import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { formatInr } from '../../lib/formatters'
import type { AccountType } from '../../types'
import { useAccounts, useCreateAccount, useDeleteAccount } from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Give the account a name').max(100),
  type: z.enum(['BANK', 'CARD', 'CASH', 'WALLET']),
  openingBalance: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, 'Enter an amount like 5000 or 5000.50'),
})
type FormValues = z.infer<typeof schema>

const TYPES: AccountType[] = ['BANK', 'CARD', 'CASH', 'WALLET']

export function AccountsPage() {
  const accounts = useAccounts()
  const create = useCreateAccount()
  const remove = useDeleteAccount()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: 'BANK', openingBalance: '0' },
  })

  const onSubmit = (values: FormValues) =>
    create.mutate(values, { onSuccess: () => reset({ name: '', type: 'BANK', openingBalance: '0' }) })

  return (
    <>
      <h1 className="h3 mb-4">Accounts</h1>

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Row className="g-3 align-items-start">
              <Col md={4}>
                <Form.Group controlId="acc-name">
                  <Form.Label>Name</Form.Label>
                  <Form.Control {...register('name')} isInvalid={!!errors.name} placeholder="e.g. HDFC Savings" />
                  <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="acc-type">
                  <Form.Label>Type</Form.Label>
                  <Form.Select {...register('type')}>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t[0] + t.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="acc-balance">
                  <Form.Label>Opening balance (₹)</Form.Label>
                  <Form.Control {...register('openingBalance')} inputMode="decimal" isInvalid={!!errors.openingBalance} />
                  <Form.Control.Feedback type="invalid">{errors.openingBalance?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={2} className="d-grid pt-md-4 mt-md-1">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Adding…' : 'Add account'}
                </Button>
              </Col>
            </Row>
            {create.isError && (
              <Alert variant="danger" className="mt-3 mb-0">
                {errorMessage(create.error)}
              </Alert>
            )}
          </Form>
        </Card.Body>
      </Card>

      {accounts.isPending && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading accounts…</span>
          </Spinner>
        </div>
      )}
      {accounts.isError && <Alert variant="danger">{errorMessage(accounts.error)}</Alert>}
      {accounts.isSuccess && accounts.data.length === 0 && (
        <Alert variant="info">No accounts yet. Add one above to start recording transactions.</Alert>
      )}
      {accounts.isSuccess && accounts.data.length > 0 && (
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th className="text-end">Opening balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {accounts.data.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type[0] + a.type.slice(1).toLowerCase()}</td>
                <td className="text-end">{formatInr(a.openingBalance)}</td>
                <td className="text-end">
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={remove.isPending}
                    aria-label={`Delete account ${a.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${a.name}" and all its transactions?`)) remove.mutate(a.id)
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  )
}
