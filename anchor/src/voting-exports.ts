// Here we export some useful types and functions for interacting with the Anchor program.
import { Account, getBase58Decoder, SolanaClient } from 'gill'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import { Voting, VOTING_DISCRIMINATOR, VOTING_PROGRAM_ADDRESS, getVotingDecoder } from './client/js'
import VotingIDL from '../target/idl/voting.json'

export type VotingAccount = Account<Voting, string>

// Re-export the generated IDL and type
export { VotingIDL }

export * from './client/js'

export function getVotingProgramAccounts(rpc: SolanaClient['rpc']) {
  return getProgramAccountsDecoded(rpc, {
    decoder: getVotingDecoder(),
    filter: getBase58Decoder().decode(VOTING_DISCRIMINATOR),
    programAddress: VOTING_PROGRAM_ADDRESS,
  })
}
