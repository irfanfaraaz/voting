import { useSolana } from '@/components/solana/use-solana'
import { useQuery } from '@tanstack/react-query'
import { getVotingProgramAccounts } from '@project/anchor'
import { useVotingAccountsQueryKey } from './use-voting-accounts-query-key'

export function useVotingAccountsQuery() {
  const { client } = useSolana()

  return useQuery({
    queryKey: useVotingAccountsQueryKey(),
    queryFn: async () => await getVotingProgramAccounts(client.rpc),
  })
}
