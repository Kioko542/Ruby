import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * Builds a tiny devnet transaction (memo) so judges see a real signature + explorer link.
 * This is separate from Anchor instruction encoding; pair with POST /tx/build for the plan narrative.
 */
export async function signRubyMemoProof(params: {
  rpcUrl: string;
  walletPublicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  memo?: string;
}): Promise<{ signature: string }> {
  const { rpcUrl, walletPublicKey, signTransaction, memo = "Ruby demo — savings circle" } = params;
  const connection = new Connection(rpcUrl, "confirmed");
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const ix = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: walletPublicKey, isSigner: true, isWritable: false }],
    data: Buffer.from(memo, "utf8"),
  });

  const tx = new Transaction();
  tx.feePayer = walletPublicKey;
  tx.recentBlockhash = blockhash;
  tx.add(ix);

  const signed = await signTransaction(tx);
  const raw = signed.serialize();
  const signature = await connection.sendRawTransaction(raw, {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await connection.confirmTransaction(
    { signature, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return { signature };
}

export function explorerTxUrl(signature: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}
