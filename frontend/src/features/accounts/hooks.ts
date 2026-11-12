import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api/client'
import type { Account, AccountType, Category, Profile } from '../../types'

export function useProfile() {
  // The first call after sign-in creates the local user record on the backend.
  return useQuery({ queryKey: ['me'], queryFn: async () => (await api.get<Profile>('/me')).data })
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: async () => (await api.get<Account[]>('/accounts')).data })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  })
}

export interface AccountInput {
  name: string
  type: AccountType
  openingBalance: string
}

export function useCreateAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AccountInput) => (await api.post<Account>('/accounts', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['accounts'] })
      void qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
