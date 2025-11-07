import { VotingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'
import { useVotingIncrementMutation } from '../data-access/use-voting-increment-mutation'

export function VotingUiButtonIncrement({ account, voting }: { account: UiWalletAccount; voting: VotingAccount }) {
  const incrementMutation = useVotingIncrementMutation({ account, voting })

  return (
    <Button variant="outline" onClick={() => incrementMutation.mutateAsync()} disabled={incrementMutation.isPending}>
      Increment
    </Button>
  )
}
