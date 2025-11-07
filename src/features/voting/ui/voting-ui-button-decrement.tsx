import { VotingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVotingDecrementMutation } from '../data-access/use-voting-decrement-mutation'

export function VotingUiButtonDecrement({ account, voting }: { account: UiWalletAccount; voting: VotingAccount }) {
  const decrementMutation = useVotingDecrementMutation({ account, voting })

  return (
    <Button variant="outline" onClick={() => decrementMutation.mutateAsync()} disabled={decrementMutation.isPending}>
      Decrement
    </Button>
  )
}
