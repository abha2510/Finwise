import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { PageResponse, Transaction, TxnType } from '../../types'

export interface TransactionFilters {
  q: string
  account: string
  category: string
  from: string
  to: string
  page: number
  size: number
}

export interface TransactionInput {
  accountId: number
  categoryId: number | null
  amount: string // sent as a string: the browser never parses or computes money
  type: TxnType
  txnDate: string
  description: string
  merchant: string
  notes: string
  tags: string[]
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params: Record<string, string | number> = { page: filters.page, size: filters.size }
      if (filters.q) params.q = filters.q
      if (filters.account) params.account = filters.account
      if (filters.category) params.category = filters.category
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to
      return (await api.get<PageResponse<Transaction>>('/transactions', { params })).data
    },
  })
}

export function useSaveTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: number; input: TransactionInput }) =>
      id
        ? (await api.put<Transaction>(`/transactions/${id}`, input)).data
        : (await api.post<Transaction>('/transactions', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/transactions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}

export function useSetCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, categoryId }: { id: number; categoryId: number }) =>
      (await api.patch<Transaction>(`/transactions/${id}/category`, { categoryId })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
}
