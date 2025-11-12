import { ACTIONS_CORS_HEADERS, ActionGetResponse, ActionPostRequest } from '@solana/actions'
import {
  createSolanaClient,
  address,
  getProgramDerivedAddress,
  getU64Encoder,
  createNoopSigner,
  Address,
  createTransaction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  getCompiledTransactionMessageEncoder,
  compileTransactionMessage,
} from 'gill'
import { getVoteInstructionAsync, VOTING_PROGRAM_ADDRESS } from '@project/anchor'
import { createHash } from 'crypto'

const { rpc } = createSolanaClient({
  urlOrMoniker: 'http://localhost:8899',
})
export const OPTIONS = GET
export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: 'https://www.licious.in/blog/wp-content/uploads/2022/06/chicken-hyderabadi-biryani-01.jpg',
    title: 'Vote for the best Biryani',
    description: 'Vote for the best Biryani in the world (HYD ofc)',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Hyderabadi Biryani',
          href: '/api/vote?candidate=hyd',
          type: 'post',
        },
        {
          label: 'Vote for Lucknowi Biryani',
          href: '/api/vote?candidate=luck',
          type: 'post',
        },
      ],
    },
  }
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get('candidate')
  if (!candidate) {
    return Response.json({ error: 'Candidate is required' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }
  if (candidate !== 'hyd' && candidate !== 'luck') {
    return Response.json({ error: 'Invalid candidate' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const body: ActionPostRequest = await request.json()
  let voter: Address

  try {
    voter = address(body.account)
  } catch (error) {
    return Response.json({ error: 'Invalid account' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const pollId = BigInt(1) // TODO: get poll id

  const hashedCandidateName = createHash('sha256').update(candidate, 'utf-8').digest()

  // Derive candidate PDA using the hash (matching Rust's seed)

  const [candidateAddress] = await getProgramDerivedAddress({
    programAddress: VOTING_PROGRAM_ADDRESS,
    seeds: [hashedCandidateName, getU64Encoder().encode(pollId)],
  })

  // Derive poll PDA using the poll id
  const [pollAddress] = await getProgramDerivedAddress({
    programAddress: VOTING_PROGRAM_ADDRESS,
    seeds: [getU64Encoder().encode(pollId)],
  })

  // get latest blockhash
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()

  // create voter signer
  const voterSigner = createNoopSigner(voter)

  // create vote instruction
  const voteIx = await getVoteInstructionAsync({
    signer: voterSigner,
    poll: pollAddress,
    candidate: candidateAddress,
    candidateName: candidate,
    pollId,
  })

  // ✅ Create transaction with gill
  const transactionMessage = createTransaction({
    instructions: [voteIx],
    latestBlockhash,
    feePayer: voterSigner,
    version: 0,
  })
  console.log(transactionMessage)

  // ✅ Compile to full Transaction object (with empty signatures for unsigned)
  const compiledTransaction = compileTransaction(transactionMessage)

  // ✅ Serialize the full transaction (message + signatures) to base64
  const base64Transaction = getBase64EncodedWireTransaction(compiledTransaction)

  // ✅ Return in Solana Actions format
  return Response.json(
    {
      transaction: base64Transaction,
    },
    { headers: ACTIONS_CORS_HEADERS },
  )
}
