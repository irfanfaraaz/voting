import { useSolana } from '@/components/solana/use-solana'
import { WalletDropdown } from '@/components/wallet-dropdown'
import { AppHero } from '@/components/app-hero'
import { VotingUiButtonInitialize } from './ui/voting-ui-button-initialize'
import { VotingUiList } from './ui/voting-ui-list'
import { VotingUiProgramExplorerLink } from './ui/voting-ui-program-explorer-link'
import { VotingUiProgramGuard } from './ui/voting-ui-program-guard'

export default function VotingFeature() {
  const { account } = useSolana()

  return (
    <VotingUiProgramGuard>
      <AppHero
        title="Voting"
        subtitle={
          account
            ? "Initialize a new voting onchain by clicking the button. Use the program's methods (increment, decrement, set, and close) to change the state of the account."
            : 'Select a wallet to run the program.'
        }
      >
        <p className="mb-6">
          <VotingUiProgramExplorerLink />
        </p>
        {account ? (
          <VotingUiButtonInitialize account={account} />
        ) : (
          <div style={{ display: 'inline-block' }}>
            <WalletDropdown />
          </div>
        )}
      </AppHero>
      {account ? <VotingUiList account={account} /> : null}
    </VotingUiProgramGuard>
  )
}
