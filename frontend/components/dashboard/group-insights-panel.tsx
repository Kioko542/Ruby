"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createBlink,
  fetchBlinkActions,
  fetchGroupCycle,
  fetchGroupYield,
  fetchMemberCreditScore,
  fetchWeb3Balance,
  lamportsToSol,
  type BlinkActionRow,
  type Group,
  type GroupCycleResponse,
  type GroupYieldResponse,
  type Web3BalanceResponse,
} from "@/lib/ruby-api";

type Props = {
  group: Group;
  walletAddress: string;
  memberId: string | null;
};

export function GroupInsightsPanel({ group, walletAddress, memberId }: Props) {
  const [cycle, setCycle] = useState<GroupCycleResponse | null>(null);
  const [yieldData, setYieldData] = useState<GroupYieldResponse | null>(null);
  const [credit, setCredit] = useState<number | null>(null);
  const [balance, setBalance] = useState<Web3BalanceResponse | null>(null);
  const [blinks, setBlinks] = useState<BlinkActionRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blinkBusy, setBlinkBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [c, y, b, bl] = await Promise.all([
        fetchGroupCycle(group.id),
        fetchGroupYield(group.id),
        walletAddress ? fetchWeb3Balance(walletAddress) : Promise.resolve(null),
        fetchBlinkActions(),
      ]);
      setCycle(c);
      setYieldData(y);
      setBalance(b);
      setBlinks(bl.filter((x) => x.group_id === group.id).slice(0, 20));
      if (memberId) {
        const cr = await fetchMemberCreditScore(group.id, memberId);
        setCredit(cr.credit_score);
      } else {
        setCredit(null);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load insights");
    } finally {
      setBusy(false);
    }
  }, [group.id, walletAddress, memberId]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  const createContributeBlink = async () => {
    setBlinkBusy(true);
    setErr(null);
    try {
      await createBlink("contribute", {
        group_id: group.id,
        ...(memberId ? { member_id: memberId } : {}),
        payload: { note: "Dashboard blink" },
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Blink create failed");
    } finally {
      setBlinkBusy(false);
    }
  };

  return (
    <div className="border-t border-[var(--border-strong)] bg-slate-50/80 px-4 py-4 text-sm">
      {err && <p className="mb-2 text-xs text-red-700">{err}</p>}
      {busy && !cycle ? (
        <p className="text-xs text-[var(--muted)]">Loading cycle & yield…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Wallet (RPC via API)</h4>
            {balance ? (
              <p className="mt-2 font-mono text-lg">
                {lamportsToSol(balance.lamports)} SOL
                <span className="mt-1 block text-[10px] text-[var(--muted)]">{balance.solana_rpc_url}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">No wallet on session</p>
            )}
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 text-xs text-indigo-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Credit score</h4>
            {memberId ? (
              <p className="mt-2 text-2xl font-semibold">{credit ?? "—"}</p>
            ) : (
              <p className="mt-2 text-xs text-[var(--muted)]">Join this circle to see your score.</p>
            )}
          </div>

          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3 md:col-span-2 lg:col-span-1">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Savings cycle</h4>
            {cycle && (
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  Active cycle <strong>{cycle.active_cycle}</strong> · Vault {lamportsToSol(cycle.vault_balance)} SOL
                </li>
                <li>Payout ready: {String(cycle.payout_ready)}</li>
                {cycle.cycle_deadline && (
                  <li>Deadline {new Date(cycle.cycle_deadline).toLocaleString()}</li>
                )}
                {cycle.settlement_note && <li className="text-[var(--muted)]">{cycle.settlement_note}</li>}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3 md:col-span-2">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Yield events</h4>
            {yieldData && yieldData.events.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No treasury yield rows yet for this circle.</p>
            ) : (
              <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">
                {yieldData?.events.map((e) => (
                  <li key={e.id} className="font-mono">
                    {e.protocol} · {lamportsToSol(e.amount_deposited)} SOL · APY {e.apy}% ·{" "}
                    <span className="text-[var(--muted)]">{e.tx_signature?.slice(0, 12)}…</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3 md:col-span-2 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Blinks (API)</h4>
              <button
                type="button"
                disabled={blinkBusy}
                onClick={() => void createContributeBlink()}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {blinkBusy ? "Creating…" : "Create contribute blink"}
              </button>
            </div>
            {blinks.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No blinks for this circle yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {blinks.map((a) => (
                  <li key={a.id} className="flex flex-wrap gap-2">
                    <span className="font-mono">{a.id}</span>
                    <span>{a.blink_type}</span>
                    <span className="text-[var(--muted)]">{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
