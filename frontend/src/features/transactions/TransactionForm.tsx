import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { errorMessage } from '../../api/client'
import { todayIst } from '../../lib/formatters'
import type { Account, Category, Transaction } from '../../types'
import { useSaveTransaction } from './hooks'

const schema = z.object({
  accountId: z.string().min(1, 'Choose an account'),
  categoryId: z.string(),
  amount: z
    .string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/, 'Enter an amount like 450 or 450.50')
    .refine((v) => /[1-9]/.test(v), 'Amount must be greater than zero'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  txnDate: z.string().min(1, 'Pick a date'),
  description: z.string().max(500),
  merchant: z.string().max(200),
  notes: z.string().max(1000),
  tags: z.string().max(400),
})
type FormValues = z.infer<typeof schema>

function emptyValues(accounts: Account[]): FormValues {
  return {
    accountId: accounts[0] ? String(accounts[0].id) : '',
    categoryId: '',
    amount: '',
    type: 'EXPENSE',
    txnDate: todayIst(),
    description: '',
    merchant: '',
    notes: '',
    tags: '',
  }
}

function toValues(t: Transaction): FormValues {
  return {
    accountId: String(t.accountId),
    categoryId: t.categoryId ? String(t.categoryId) : '',
    amount: String(t.amount),
    type: t.type,
    txnDate: t.txnDate,
    description: t.description ?? '',
    merchant: t.merchant ?? '',
    notes: t.notes ?? '',
    tags: t.tags.join(', '),
  }
}

interface Props {
  show: boolean
  onHide: () => void
  editing: Transaction | null
  accounts: Account[]
  categories: Category[]
}

export function TransactionForm({ show, onHide, editing, accounts, categories }: Props) {
  const save = useSaveTransaction()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues(accounts) })

  useEffect(() => {
    if (show) {
      reset(editing ? toValues(editing) : emptyValues(accounts))
      save.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, editing, accounts, reset])

  const onSubmit = (v: FormValues) =>
    save.mutate(
      {
        id: editing?.id,
        input: {
          accountId: Number(v.accountId),
          categoryId: v.categoryId ? Number(v.categoryId) : null,
          amount: v.amount,
          type: v.type,
          txnDate: v.txnDate,
          description: v.description,
          merchant: v.merchant,
          notes: v.notes,
          tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
      },
      { onSuccess: onHide },
    )

  return (
    <Offcanvas show={show} onHide={onHide} placement="end" aria-labelledby="txn-form-title">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="txn-form-title">{editing ? 'Edit transaction' : 'Add transaction'}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Form.Group className="mb-3" controlId="txn-type">
            <Form.Label>Type</Form.Label>
            <Form.Select {...register('type')}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-amount">
            <Form.Label>Amount (₹)</Form.Label>
            <Form.Control {...register('amount')} inputMode="decimal" isInvalid={!!errors.amount} placeholder="450.00" />
            <Form.Control.Feedback type="invalid">{errors.amount?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-date">
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" {...register('txnDate')} isInvalid={!!errors.txnDate} />
            <Form.Control.Feedback type="invalid">{errors.txnDate?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-account">
            <Form.Label>Account</Form.Label>
            <Form.Select {...register('accountId')} isInvalid={!!errors.accountId}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.accountId?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-category">
            <Form.Label>Category</Form.Label>
            <Form.Select {...register('categoryId')}>
              <option value="">Needs review</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-merchant">
            <Form.Label>Merchant</Form.Label>
            <Form.Control {...register('merchant')} isInvalid={!!errors.merchant} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-description">
            <Form.Label>Description</Form.Label>
            <Form.Control {...register('description')} isInvalid={!!errors.description} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-tags">
            <Form.Label>Tags</Form.Label>
            <Form.Control {...register('tags')} placeholder="food, weekend" />
            <Form.Text>Separate tags with commas.</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="txn-notes">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={2} {...register('notes')} isInvalid={!!errors.notes} />
          </Form.Group>

          {save.isError && <Alert variant="danger">{errorMessage(save.error)}</Alert>}

          <div className="d-flex gap-2">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline-secondary" onClick={onHide}>
              Cancel
            </Button>
          </div>
        </Form>
      </Offcanvas.Body>
    </Offcanvas>
  )
}
