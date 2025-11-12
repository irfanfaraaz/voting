import {
  Blockhash,
  createSolanaClient,
  createTransaction,
  getProgramDerivedAddress,
  getU64Encoder,
  Instruction,
  KeyPairSigner,
  signTransactionMessageWithSigners,
} from 'gill'
import {
  fetchPoll,
  fetchMaybePoll,
  getInitializePollInstructionAsync,
  getInitializeCandidateInstructionAsync,
  fetchCandidate,
  fetchMaybeCandidate,
  getVoteInstructionAsync,
} from '../src'
import { VOTING_PROGRAM_ADDRESS } from '../src/client/js/generated/programs/voting'
import { createHash } from 'crypto'
import { loadKeypairSignerFromFile } from 'gill/node'

const { rpc, sendAndConfirmTransaction } = createSolanaClient({ urlOrMoniker: process.env.ANCHOR_PROVIDER_URL! })

describe('voting', () => {
  let payer: KeyPairSigner

  beforeAll(async () => {
    payer = await loadKeypairSignerFromFile(process.env.ANCHOR_WALLET!)
  })

  it('Initialize Poll and Candidate', async () => {
    // ARRANGE
    expect.assertions(7)
    const pollId = 1n
    const description = 'Test poll'
    const pollStart = BigInt(Date.now())
    const pollEnd = BigInt(Date.now() + 86400000)
    const candidateName = 'Test candidate'

    console.log('=== DEBUG: Starting test ===')
    console.log('pollId:', pollId.toString())
    console.log('candidateName:', candidateName)

    // Create poll first
    const pollIx = await getInitializePollInstructionAsync({
      signer: payer,
      pollId,
      description,
      pollStart,
      pollEnd,
    })

    console.log('\n=== DEBUG: Poll Instruction ===')
    console.log('Poll instruction accounts:')
    pollIx.accounts.forEach((acc, idx) => {
      const writable = 'isWritable' in acc ? acc.isWritable : undefined
      const signer = 'isSigner' in acc ? acc.isSigner : undefined
      console.log(`  [${idx}] ${acc.address} (writable: ${writable}, signer: ${signer})`)
    })
    const pollAddressFromPollIx = pollIx.accounts[1].address
    console.log('Poll address from pollIx:', pollAddressFromPollIx)

    // ACT - Create poll
    try {
      await sendAndConfirm({ ix: pollIx, payer })
      console.log('✓ Poll created successfully')
    } catch (error) {
      console.error('✗ Failed to create poll:', error)
      throw error
    }

    // ASSERT - Verify poll
    const poll = await fetchPoll(rpc, pollIx.accounts[1].address)
    console.log('Poll data:', {
      pollId: poll.data.pollId.toString(),
      description: poll.data.description,
      candidateAmount: poll.data.candidateAmount.toString(),
    })
    expect(poll.data.pollId).toEqual(pollId)
    expect(poll.data.description).toEqual(description)
    expect(poll.data.pollStart).toEqual(pollStart)
    expect(poll.data.pollEnd).toEqual(pollEnd)
    expect(poll.data.candidateAmount).toEqual(0n)

    // Create candidate using the same poll - pass the poll address explicitly
    const pollAddress = pollIx.accounts[1].address

    console.log('\n=== DEBUG: Candidate Instruction ===')
    console.log('pollId being used:', pollId.toString())
    console.log('pollAddress being passed:', pollAddress)

    // Hash the candidate name to match Rust's hashed seed
    // Rust uses: candidate_name.to_hashed_bytes() which calls hash(candidate_name.as_bytes()).to_bytes()
    // So we need: SHA-256 hash of candidateName (32 bytes)
    const hashedCandidateName = createHash('sha256').update(candidateName, 'utf-8').digest()
    console.log('Hashed candidate name:', hashedCandidateName.toString('hex'))

    // Derive candidate PDA using the hash (matching Rust's seed)
    const [candidateAddress] = await getProgramDerivedAddress({
      programAddress: VOTING_PROGRAM_ADDRESS,
      seeds: [
        hashedCandidateName, // SHA-256 hash (32 bytes)
        getU64Encoder().encode(pollId),
      ],
    })
    console.log('Derived candidate address (with hash):', candidateAddress)

    // Use Codama's auto-generated code - pass the derived address explicitly
    // This bypasses Codama's auto-derivation (which would use string with size prefix)
    // Now we're using Codama's code but with the correct hashed PDA
    const candidateIx = await getInitializeCandidateInstructionAsync({
      signer: payer,
      poll: pollAddress,
      candidate: candidateAddress, // Pass the derived address with hash
      candidateName, // Still pass the original name for instruction data
      pollId,
    })

    console.log('Candidate instruction accounts:')
    candidateIx.accounts.forEach((acc, idx) => {
      const writable = 'isWritable' in acc ? acc.isWritable : undefined
      const signer = 'isSigner' in acc ? acc.isSigner : undefined
      console.log(`  [${idx}] ${acc.address} (writable: ${writable}, signer: ${signer})`)
    })
    const pollAddressFromCandidateIx = candidateIx.accounts[1].address
    const candidateAddressFromCandidateIx = candidateIx.accounts[2].address
    console.log('Poll address from candidateIx:', pollAddressFromCandidateIx)
    console.log('Candidate address from candidateIx:', candidateAddressFromCandidateIx)
    console.log('Poll addresses match:', pollAddressFromPollIx === pollAddressFromCandidateIx)

    // ACT - Create candidate
    try {
      await sendAndConfirm({ ix: candidateIx, payer })
      console.log('✓ Candidate created successfully')
    } catch (error) {
      console.error('✗ Failed to create candidate:', error)
      if (error && typeof error === 'object' && 'context' in error) {
        const ctx = (error as { context?: { logs?: string[] } }).context
        if (ctx && ctx.logs) {
          console.error('Program logs:')
          ctx.logs.forEach((log: string) => console.error('  ', log))
        }
      }
      throw error
    }

    // ASSERT - Verify candidate (candidate is at accounts[2]: signer=0, poll=1, candidate=2, systemProgram=3)
    const candidate = await fetchCandidate(rpc, candidateIx.accounts[2].address)
    console.log('Candidate data:', {
      candidateName: candidate.data.candidateName,
      candidateVotes: candidate.data.candidateVotes.toString(),
    })
    expect(candidate.data.candidateName).toEqual(candidateName)
    expect(candidate.data.candidateVotes).toEqual(0n)

    console.log('\n=== DEBUG: Test completed successfully ===')
  })

  it('Vote for Candidate', async () => {
    // ARRANGE
    expect.assertions(3)
    const pollId = 2n
    const description = 'Vote test poll'
    const pollStart = BigInt(Date.now())
    const pollEnd = BigInt(Date.now() + 86400000)
    const candidateName = 'Vote test candidate'

    // Create poll first
    const pollIx = await getInitializePollInstructionAsync({
      signer: payer,
      pollId,
      description,
      pollStart,
      pollEnd,
    })
    await sendAndConfirm({ ix: pollIx, payer })
    const pollAddress = pollIx.accounts[1].address

    // Hash the candidate name to match Rust's hashed seed
    const hashedCandidateName = createHash('sha256').update(candidateName, 'utf-8').digest()

    // Derive candidate PDA using the hash (matching Rust's seed)
    const [candidateAddress] = await getProgramDerivedAddress({
      programAddress: VOTING_PROGRAM_ADDRESS,
      seeds: [
        hashedCandidateName, // SHA-256 hash (32 bytes)
        getU64Encoder().encode(pollId),
      ],
    })

    // Create candidate
    const candidateIx = await getInitializeCandidateInstructionAsync({
      signer: payer,
      poll: pollAddress,
      candidate: candidateAddress, // Pass the derived address with hash
      candidateName, // Still pass the original name for instruction data
      pollId,
    })
    await sendAndConfirm({ ix: candidateIx, payer })

    // Get initial vote count
    const candidateBefore = await fetchCandidate(rpc, candidateAddress)
    const initialVotes = candidateBefore.data.candidateVotes
    expect(initialVotes).toEqual(0n)

    // ACT - Vote
    const voteIx = await getVoteInstructionAsync({
      signer: payer,
      poll: pollAddress,
      candidate: candidateAddress, // Pass the derived address with hash
      candidateName, // Still pass the original name for instruction data
      pollId,
    })
    await sendAndConfirm({ ix: voteIx, payer })

    // ASSERT - Verify vote count increased
    const candidateAfter = await fetchCandidate(rpc, candidateAddress)
    expect(candidateAfter.data.candidateVotes).toEqual(1n)
    expect(candidateAfter.data.candidateVotes).toBeGreaterThan(initialVotes)
  })

  it('Initialize Poll 1 with Biryani Candidates', async () => {
    // ARRANGE
    expect.assertions(5)
    const pollId = 1n
    const description = 'Vote for the best Biryani'
    const pollStart = BigInt(Date.now())
    const pollEnd = BigInt(Date.now() + 86400000)
    const candidates = ['hyd', 'luck']

    // Check if poll already exists, if not create it
    const [pollAddress] = await getProgramDerivedAddress({
      programAddress: VOTING_PROGRAM_ADDRESS,
      seeds: [getU64Encoder().encode(pollId)],
    })

    const existingPoll = await fetchMaybePoll(rpc, pollAddress)
    const pollExists = existingPoll.exists

    if (!pollExists) {
      // Create poll
      const pollIx = await getInitializePollInstructionAsync({
        signer: payer,
        pollId,
        description,
        pollStart,
        pollEnd,
    })
      await sendAndConfirm({ ix: pollIx, payer })
      console.log('✓ Poll 1 created')
    } else {
      console.log('✓ Poll 1 already exists')
    }

    // Initialize candidates
    for (const candidateName of candidates) {
      const hashedCandidateName = createHash('sha256').update(candidateName, 'utf-8').digest()

      const [candidateAddress] = await getProgramDerivedAddress({
        programAddress: VOTING_PROGRAM_ADDRESS,
        seeds: [hashedCandidateName, getU64Encoder().encode(pollId)],
      })

      // Check if candidate already exists
      const existingCandidate = await fetchMaybeCandidate(rpc, candidateAddress)
      const candidateExists = existingCandidate.exists

      if (!candidateExists) {
        const candidateIx = await getInitializeCandidateInstructionAsync({
          signer: payer,
          poll: pollAddress,
          candidate: candidateAddress,
          candidateName,
          pollId,
        })
        await sendAndConfirm({ ix: candidateIx, payer })
        console.log(`✓ Candidate "${candidateName}" created`)
      } else {
        console.log(`✓ Candidate "${candidateName}" already exists`)
      }
    }

    // ASSERT - Verify both candidates exist
    const hashedHyd = createHash('sha256').update('hyd', 'utf-8').digest()
    const [hydAddress] = await getProgramDerivedAddress({
      programAddress: VOTING_PROGRAM_ADDRESS,
      seeds: [hashedHyd, getU64Encoder().encode(pollId)],
    })
    const hydCandidate = await fetchMaybeCandidate(rpc, hydAddress)
    expect(hydCandidate.exists).toBe(true)
    if (hydCandidate.exists) {
      expect(hydCandidate.data.candidateName).toEqual('hyd')
    }

    const hashedLuck = createHash('sha256').update('luck', 'utf-8').digest()
    const [luckAddress] = await getProgramDerivedAddress({
      programAddress: VOTING_PROGRAM_ADDRESS,
      seeds: [hashedLuck, getU64Encoder().encode(pollId)],
    })
    const luckCandidate = await fetchMaybeCandidate(rpc, luckAddress)
    expect(luckCandidate.exists).toBe(true)
    if (luckCandidate.exists) {
      expect(luckCandidate.data.candidateName).toEqual('luck')
    }

    const poll = await fetchPoll(rpc, pollAddress)
    expect(poll.data.pollId).toEqual(pollId)
  })
})

// Helper function to keep the tests DRY
let latestBlockhash: Awaited<ReturnType<typeof getLatestBlockhash>> | undefined
async function getLatestBlockhash(): Promise<Readonly<{ blockhash: Blockhash; lastValidBlockHeight: bigint }>> {
  if (latestBlockhash) {
    return latestBlockhash
  }
  return await rpc
    .getLatestBlockhash()
    .send()
    .then(({ value }) => value)
}
async function sendAndConfirm({ ix, payer }: { ix: Instruction; payer: KeyPairSigner }) {
  try {
  const tx = createTransaction({
    feePayer: payer,
    instructions: [ix],
    version: 'legacy',
    latestBlockhash: await getLatestBlockhash(),
  })
  const signedTransaction = await signTransactionMessageWithSigners(tx)
    const result = await sendAndConfirmTransaction(signedTransaction)
    return result
  } catch (error) {
    console.error('sendAndConfirm error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}
