// Here we export some useful types and functions for interacting with the Anchor program.
import { SolanaClient } from 'gill'
import bs58 from 'bs58'
import {
  VOTING_PROGRAM_ADDRESS,
  getPollDiscriminatorBytes,
  getCandidateDiscriminatorBytes,
  getPollDecoder,
  getCandidateDecoder,
} from './client/js'
import { getProgramAccountsDecoded } from './helpers/get-program-accounts-decoded'
import VotingIDL from '../target/idl/voting.json'

// Re-export the generated IDL and type
export { VotingIDL }

export * from './client/js'

export async function getVotingProgramAccounts(rpc: SolanaClient['rpc']) {
  // Get Poll accounts
  const pollAccounts = await getProgramAccountsDecoded(rpc, {
    decoder: getPollDecoder(),
    filter: bs58.encode(new Uint8Array(getPollDiscriminatorBytes())),
    programAddress: VOTING_PROGRAM_ADDRESS,
  })

  // Get Candidate accounts
  const candidateAccounts = await getProgramAccountsDecoded(rpc, {
    decoder: getCandidateDecoder(),
    filter: bs58.encode(new Uint8Array(getCandidateDiscriminatorBytes())),
    programAddress: VOTING_PROGRAM_ADDRESS,
  })

  return {
    polls: pollAccounts,
    candidates: candidateAccounts,
  }
}
