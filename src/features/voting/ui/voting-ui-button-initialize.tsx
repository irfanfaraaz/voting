import { Button } from '@/components/ui/button'
import { UiWalletAccount } from '@wallet-ui/react'

import { useVotingInitializeMutation } from '@/features/voting/data-access/use-voting-initialize-mutation'

export function VotingUiButtonInitialize({ account }: { account: UiWalletAccount }) {
  const mutationInitialize = useVotingInitializeMutation({ account })

  return (
    <Button onClick={() => mutationInitialize.mutateAsync()} disabled={mutationInitialize.isPending}>
      Initialize Voting {mutationInitialize.isPending && '...'}
    </Button>
  )
}
