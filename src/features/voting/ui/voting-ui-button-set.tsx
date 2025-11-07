import { VotingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVotingSetMutation } from '@/features/voting/data-access/use-voting-set-mutation'

export function VotingUiButtonSet({ account, voting }: { account: UiWalletAccount; voting: VotingAccount }) {
  const setMutation = useVotingSetMutation({ account, voting })

  return (
    <Button
      variant="outline"
      onClick={() => {
        const value = window.prompt('Set value to:', voting.data.count.toString() ?? '0')
        if (!value || parseInt(value) === voting.data.count || isNaN(parseInt(value))) {
          return
        }
        return setMutation.mutateAsync(parseInt(value))
      }}
      disabled={setMutation.isPending}
    >
      Set
    </Button>
  )
}
