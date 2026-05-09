import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

/** Ruby protocol program (devnet) — matches contracts/idl/ruby_protocol.json */
export const DEFAULT_RUBY_PROGRAM_ID = new PublicKey("BsHiSX9NmkNMTYP8UcAY71aKVZwcCgA2Tea1tmgeQbdv");

const IX_CREATE_GROUP = Buffer.from([79, 60, 158, 134, 61, 199, 56, 248]);
const IX_JOIN_GROUP = Buffer.from([121, 56, 199, 19, 250, 70, 44, 184]);
const IX_CONTRIBUTE = Buffer.from([82, 33, 68, 131, 32, 0, 205, 95]);

export function rubyProgramId(): PublicKey {
  const s = process.env.NEXT_PUBLIC_RUBY_PROGRAM_ID;
  return s ? new PublicKey(s) : DEFAULT_RUBY_PROGRAM_ID;
}

function borshStringUtf8(s: string): Buffer {
  const utf8 = Buffer.from(s, "utf8");
  const out = Buffer.alloc(4 + utf8.length);
  out.writeUInt32LE(utf8.length, 0);
  utf8.copy(out, 4);
  return out;
}

export function deriveGroupPda(groupIdStr: string, program: PublicKey = rubyProgramId()): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("group"), Buffer.from(groupIdStr, "utf8")], program)[0];
}

export function deriveMemberPda(
  groupPda: PublicKey,
  memberWallet: PublicKey,
  program: PublicKey = rubyProgramId(),
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member"), groupPda.toBuffer(), memberWallet.toBuffer()],
    program,
  )[0];
}

function encodeCreateGroupData(groupId: string, contributionLamports: bigint, maxMembers: number): Buffer {
  const m = Math.min(255, Math.max(1, maxMembers));
  const tail = Buffer.alloc(8 + 1);
  tail.writeBigUInt64LE(contributionLamports, 0);
  tail.writeUInt8(m, 8);
  return Buffer.concat([IX_CREATE_GROUP, borshStringUtf8(groupId), tail]);
}

export function buildCreateGroupInstruction(params: {
  creator: PublicKey;
  groupId: string;
  contributionLamports: bigint;
  maxMembers: number;
  program?: PublicKey;
}): TransactionInstruction {
  const program = params.program ?? rubyProgramId();
  const groupPda = deriveGroupPda(params.groupId, program);
  return new TransactionInstruction({
    programId: program,
    keys: [
      { pubkey: params.creator, isSigner: true, isWritable: true },
      { pubkey: groupPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeCreateGroupData(params.groupId, params.contributionLamports, params.maxMembers),
  });
}

export function buildJoinGroupInstruction(
  memberWallet: PublicKey,
  groupPda: PublicKey,
  program: PublicKey = rubyProgramId(),
): TransactionInstruction {
  const memberPda = deriveMemberPda(groupPda, memberWallet, program);
  return new TransactionInstruction({
    programId: program,
    keys: [
      { pubkey: memberWallet, isSigner: true, isWritable: true },
      { pubkey: groupPda, isSigner: false, isWritable: true },
      { pubkey: memberPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: IX_JOIN_GROUP,
  });
}

export function buildContributeInstruction(
  memberWallet: PublicKey,
  groupPda: PublicKey,
  amountLamports: bigint,
  onTime: boolean,
  program: PublicKey = rubyProgramId(),
): TransactionInstruction {
  const memberPda = deriveMemberPda(groupPda, memberWallet, program);
  const amt = Buffer.alloc(8);
  amt.writeBigUInt64LE(amountLamports, 0);
  const data = Buffer.concat([IX_CONTRIBUTE, amt, Buffer.from([onTime ? 1 : 0])]);
  return new TransactionInstruction({
    programId: program,
    keys: [
      { pubkey: memberWallet, isSigner: true, isWritable: false },
      { pubkey: groupPda, isSigner: false, isWritable: true },
      { pubkey: memberPda, isSigner: false, isWritable: true },
    ],
    data,
  });
}

export async function signAndSendTransaction(opts: {
  connection: Connection;
  feePayer: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  instructions: TransactionInstruction[];
}): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await opts.connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ feePayer: opts.feePayer, recentBlockhash: blockhash });
  tx.add(...opts.instructions);
  const signed = await opts.signTransaction(tx);
  const sig = await opts.connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  await opts.connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed",
  );
  return sig;
}

export function explorerTxUrl(signature: string, cluster: "devnet" | "mainnet-beta" = "devnet"): string {
  const c = cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${c}`;
}

export function getBrowserSolanaSigner():
  | { publicKey: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> }
  | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    solana?: { publicKey?: PublicKey; signTransaction: (tx: Transaction) => Promise<Transaction> };
  };
  if (!w.solana?.signTransaction || !w.solana.publicKey) return null;
  return { publicKey: w.solana.publicKey, signTransaction: (tx) => w.solana!.signTransaction(tx) };
}
