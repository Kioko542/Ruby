import { useAuthStore } from "@/stores/auth-store";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080"}/api/v1`;

export type Group = {
  id: string;
  name: string;
  creator_wallet: string;
  contribution_amt: number;
  cycle_count: number;
  max_members: number;
  vault_balance: number;
  swig_vault_addr: string;
  on_chain_pda: string;
  active_cycle: number;
  cycle_deadline?: string;
  payout_ready: boolean;
  created_at: string;
  members?: Member[];
};

export type Member = {
  id: string;
  group_id: string;
  wallet_address: string;
  credit_score: number;
  total_contributed: number;
  joined_at: string;
};

export type ChainEvent = {
  id: number;
  group_id: string;
  event_type: string;
  signature: string;
  raw_payload: string;
  created_at: string;
};

export type TxPlan = {
  network: string;
  program_id: string;
  instruction_name: string;
  accounts: Record<string, unknown>;
  args: Record<string, unknown>;
  has_idl: boolean;
};

export type WsEvent = {
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

function headers(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res: Response): Promise<string> {
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (typeof body?.error === "string") message = body.error;
  } catch {
    /* ignore */
  }
  return message;
}

export async function fetchGroups(): Promise<Group[]> {
  const res = await fetch(`${API_BASE}/groups`, { headers: headers() });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Group[]>;
}

export async function fetchChainEvents(limit = 50): Promise<ChainEvent[]> {
  const res = await fetch(`${API_BASE}/chain-events?limit=${limit}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<ChainEvent[]>;
}

export async function fetchOnchainConfig(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/onchain/config`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Record<string, unknown>>;
}

export async function createGroup(body: {
  id: string;
  name: string;
  creator_wallet: string;
  contribution_amt: number;
  max_members: number;
  swig_vault_addr?: string;
  on_chain_pda?: string;
}): Promise<Group> {
  const res = await fetch(`${API_BASE}/groups`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Group>;
}

export async function joinGroup(
  groupId: string,
  body: { member_id: string; wallet_address: string; invite_code?: string; referrer_member_id?: string },
): Promise<{ member: Member; referral_applied: boolean }> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupId)}/join`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ member: Member; referral_applied: boolean }>;
}

export async function contribute(
  groupId: string,
  body: {
    member_id: string;
    wallet_address: string;
    amount: number;
    cycle_number: number;
    tx_signature: string;
  },
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupId)}/contribute`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Record<string, unknown>>;
}

export async function buildTx(
  action:
    | "create-group"
    | "contribute"
    | "create-loan"
    | "vote-loan"
    | "create-swig-proposal"
    | "approve-swig-proposal"
    | "create-blink",
  body: Record<string, unknown>,
): Promise<TxPlan> {
  const res = await fetch(`${API_BASE}/tx/build/${encodeURIComponent(action)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<TxPlan>;
}

export async function runTreasuryAgent(body: { group_id?: string; dry_run?: boolean }): Promise<{
  run_at: string;
  dry_run: boolean;
  results: unknown[];
}> {
  const res = await fetch(`${API_BASE}/agent/run`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ run_at: string; dry_run: boolean; results: unknown[] }>;
}

export async function fetchGroupExplorer(groupId: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupId)}/explorer`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Record<string, string>>;
}

export function eventsWebSocketUrl(groupId?: string): string {
  const base = API_BASE.replace(/^http/, "ws");
  const q = groupId ? `?group_id=${encodeURIComponent(groupId)}` : "";
  return `${base.replace(/\/api\/v1$/, "")}/api/v1/ws${q}`;
}

export type GroupCycleResponse = {
  group_id: string;
  vault_balance: number;
  active_cycle: number;
  cycle_deadline?: string;
  payout_ready: boolean;
  last_settled_cycle: number;
  cycle_contribution: number;
  settlements: unknown[];
  settlement_note?: string;
};

export type YieldEventRow = {
  id: number;
  group_id: string;
  amount_deposited: number;
  protocol: string;
  apy: number;
  tx_signature: string;
  created_at: string;
};

export type GroupYieldResponse = {
  group_id: string;
  event_count: number;
  total_deposited: number;
  events: YieldEventRow[];
};

export type Web3BalanceResponse = {
  address: string;
  lamports: number;
  sol: number;
  solana_rpc_url: string;
};

export type BlinkActionRow = {
  id: string;
  blink_type: string;
  group_id: string;
  member_id: string;
  payload: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function fetchGroupCycle(groupId: string): Promise<GroupCycleResponse> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupId)}/cycle`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<GroupCycleResponse>;
}

export async function fetchGroupYield(groupId: string): Promise<GroupYieldResponse> {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(groupId)}/yield`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<GroupYieldResponse>;
}

export async function fetchMemberCreditScore(groupId: string, memberId: string): Promise<{ credit_score: number }> {
  const res = await fetch(
    `${API_BASE}/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(memberId)}/credit-score`,
  );
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ credit_score: number }>;
}

export async function fetchWeb3Balance(address: string): Promise<Web3BalanceResponse> {
  const res = await fetch(`${API_BASE}/web3/balance?address=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Web3BalanceResponse>;
}

export async function fetchBlinkActions(): Promise<BlinkActionRow[]> {
  const res = await fetch(`${API_BASE}/blinks/actions`);
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<BlinkActionRow[]>;
}

export async function createBlink(
  blinkType: "contribute" | "vote" | "withdraw",
  body: { group_id: string; member_id?: string; payload?: Record<string, unknown> },
): Promise<{ action_id: string; blink_type: string; url: string; status: string }> {
  const res = await fetch(`${API_BASE}/blinks/${encodeURIComponent(blinkType)}/create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ action_id: string; blink_type: string; url: string; status: string }>;
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export function solToLamports(sol: number): number {
  return Math.round(sol * 1_000_000_000);
}
