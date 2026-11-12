import { useMemo, useState } from 'react'
import Alert from 'react-bootstrap/Alert'
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Pagination from 'react-bootstrap/Pagination'
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Table from 'react-bootstrap/Table'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { formatDate, formatInr } from '../../lib/formatters'
import type { Transaction } from '../../types'
import { useAccounts, useCategories } from '../accounts/hooks'
import { useDeleteTransaction, useSetCategory, useTransactions, type TransactionFilters } from './hooks'
import { TransactionForm } from './TransactionForm'

const PAGE_SIZE = 20
const INITIAL: TransactionFilters = { q: '', account: '', category: '', from: '', to: '', page: 0, size: PAGE_SIZE }

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(INITIAL)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const accounts = useAccounts()
  const categories = useCategories()
  const txns = useTransactions(filters)
  const remove = useDeleteTransaction()
  const setCategory = useSetCategory()

  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  )
  const accountName = useMemo(() => new Map((accounts.data ?? []).map((a) => [a.id, a.name])), [accounts.data])

  const update = (patch: Partial<TransactionFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }))
  const openNew = () => {
    setEditing(null)
    setShowForm(true)
  }
  const openEdit = (t: Transaction) => {
    setEditing(t)
    setShowForm(true)
  }

  const noAccounts = accounts.isSuccess && accounts.data.length === 0
  const data = txns.data
  const totalPages = data ? Math.max(1, Math.ceil(data.totalElements / data.size)) : 1

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Transactions</h1>
        <Button onClick={openNew} disabled={!accounts.isSuccess || noAccounts}>
          Add transaction
        </Button>
      </div>

      {noAccounts && (
        <Alert variant="info">
          Create an account first, then you can record transactions. <Link to="/accounts">Go to Accounts</Link>
        </Alert>
      )}

      <Form className="mb-3" onSubmit={(e) => e.preventDefault()} aria-label="Filter transactions">
        <Row className="g-2">
          <Col md={3}>
            <Form.Control
              type="search"
              placeholder="Search description, merchant, notes"
              aria-label="Search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
            />
          </Col>
          <Col md={2}>
            <Form.Select aria-label="Account" value={filters.account} onChange={(e) => update({ account: e.target.value })}>
              <option value="">All accounts</option>
              {(accounts.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Select aria-label="Category" value={filters.category} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2}>
            <Form.Control type="date" aria-label="From date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
          </Col>
          <Col md={2}>
            <Form.Control type="date" aria-label="To date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
          </Col>
          <Col md={1} className="d-grid">
            <Button variant="outline-secondary" onClick={() => setFilters(INITIAL)}>
              Reset
            </Button>
          </Col>
        </Row>
      </Form>

      {txns.isPending && (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading transactions…</span>
          </Spinner>
        </div>
      )}
      {txns.isError && <Alert variant="danger">{errorMessage(txns.error)}</Alert>}
      {(remove.isError || setCategory.isError) && (
        <Alert variant="danger">{errorMessage(remove.error ?? setCategory.error)}</Alert>
      )}

      {data && data.content.length === 0 && !noAccounts && (
        <Alert variant="secondary">No transactions match. Add one or adjust the filters.</Alert>
      )}

      {data && data.content.length > 0 && (
        <>
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th className="text-end">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.content.map((t) => (
                <tr key={t.id}>
                  <td className="text-nowrap">{formatDate(t.txnDate)}</td>
                  <td>
                    <div>{t.merchant || t.description || '—'}</div>
                    {t.merchant && t.description && <small className="text-body-secondary">{t.description}</small>}
                    {t.tags.map((tag) => (
                      <Badge key={tag} bg="secondary" className="ms-1">
                        {tag}
                      </Badge>
                    ))}
                  </td>
                  <td style={{ minWidth: 180 }}>
                    {t.type === 'TRANSFER' ? (
                      <span className="text-body-secondary">Transfer</span>
                    ) : (
                      <Form.Select
                        size="sm"
                        aria-label={`Category for transaction ${t.id}`}
                        value={t.categoryId ?? ''}
                        onChange={(e) => e.target.value && setCategory.mutate({ id: t.id, categoryId: Number(e.target.value) })}
                      >
                        {t.needsReview && <option value="">Needs review</option>}
                        {(categories.data ?? []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    {t.needsReview && (
                      <Badge bg="warning" text="dark" className="mt-1">
                        Needs review
                      </Badge>
                    )}
                    {t.categoryId && !t.needsReview && <span className="visually-hidden">{categoryName.get(t.categoryId)}</span>}
                  </td>
                  <td>{accountName.get(t.accountId) ?? '—'}</td>
                  <td className={`text-end text-nowrap ${t.type === 'INCOME' ? 'text-success' : ''}`}>
                    {t.type === 'INCOME' ? '+' : t.type === 'EXPENSE' ? '−' : ''}
                    {formatInr(t.amount)}
                  </td>
                  <td className="text-end text-nowrap">
                    <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      disabled={remove.isPending}
                      onClick={() => window.confirm('Delete this transaction?') && remove.mutate(t.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-body-secondary">{data.totalElements} transactions</small>
            <Pagination className="mb-0">
              <Pagination.Prev disabled={filters.page === 0} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} />
              <Pagination.Item active>
                {filters.page + 1} / {totalPages}
              </Pagination.Item>
              <Pagination.Next
                disabled={filters.page + 1 >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              />
            </Pagination>
          </div>
        </>
      )}

      <TransactionForm
        show={showForm}
        onHide={() => setShowForm(false)}
        editing={editing}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
      />
    </>
  )
}
