import { VotingAccount } from '@project/anchor'
import { UiWalletAccount } from '@wallet-ui/react'
import { Button } from '@/components/ui/button'

import { useVotingCloseMutation } from '@/features/voting/data-access/use-voting-close-mutation'

export function VotingUiButtonClose({ account, voting }: { account: UiWalletAccount; voting: VotingAccount }) {
  const closeMutation = useVotingCloseMutation({ account, voting })

  return (
    <Button
      variant="destructive"
      onClick={() => {
        if (!window.confirm('Are you sure you want to close this account?')) {
          return
        }
        return closeMutation.mutateAsync()
      }}
      disabled={closeMutation.isPending}
    >
      Close
    </Button>
  )
}
