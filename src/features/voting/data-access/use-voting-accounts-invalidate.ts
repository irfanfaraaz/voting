import { useQueryClient } from '@tanstack/react-query'
import { useVotingAccountsQueryKey } from './use-voting-accounts-query-key'

export function useVotingAccountsInvalidate() {
  const queryClient = useQueryClient()
  const queryKey = useVotingAccountsQueryKey()

  return () => queryClient.invalidateQueries({ queryKey })
}
