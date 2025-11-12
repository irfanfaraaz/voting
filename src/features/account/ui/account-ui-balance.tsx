import { Address } from 'gill'
import { useGetBalanceQuery } from '../data-access/use-get-balance-query'
import { AccountUiBalanceSol } from './account-ui-balance-sol'

export function AccountUiBalance({ address }: { address: Address }) {
  const query = useGetBalanceQuery({ address })

  const handleKeyDown = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      query.refetch()
    }
  }

  return (
    <h1
      className="text-5xl font-bold cursor-pointer"
      onClick={() => query.refetch()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Refresh balance"
    >
      {query.data?.value ? <AccountUiBalanceSol balance={query.data?.value} /> : '...'} SOL
    </h1>
  )
}
