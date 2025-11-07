import { VOTING_PROGRAM_ADDRESS } from '@project/anchor'
import { AppExplorerLink } from '@/components/app-explorer-link'
import { ellipsify } from '@wallet-ui/react'

export function VotingUiProgramExplorerLink() {
  return <AppExplorerLink address={VOTING_PROGRAM_ADDRESS} label={ellipsify(VOTING_PROGRAM_ADDRESS)} />
}
