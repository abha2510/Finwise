export type AccountType = 'BANK' | 'CARD' | 'CASH' | 'WALLET'
export type TxnType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface Profile {
  id: number
  email: string | null
  currency: string
  monthStartDay: number
}

export interface Account {
  id: number
  name: string
  type: AccountType
  openingBalance: number
}

export interface Category {
  id: number
  name: string
  type: 'INCOME' | 'EXPENSE'
  isDefault: boolean
}

export interface Transaction {
  id: number
  accountId: number
  categoryId: number | null
  amount: number
  type: TxnType
  txnDate: string
  description: string | null
  merchant: string | null
  notes: string | null
  tags: string[]
  needsReview: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
}

export interface ApiError {
  code: string
  message: string
  details: string[]
}
