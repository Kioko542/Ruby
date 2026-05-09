"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveSwigProposal,
  createBlink,
  createLoanRequest,
  createSwigProposal,
  endGroupCycle,
  fetchBlinkActions,
  fetchGroupCycle,
  fetchGroupYield,
  fetchLoanRequests,
  fetchMemberCreditScore,
  fetchSwigProposals,
  fetchWeb3Balance,
  lamportsToSol,
  solToLamports,
  voteLoanRequest,
  type BlinkActionRow,
  type Group,
  type GroupCycleResponse,
  type GroupYieldResponse,
  type LoanRequestRow,
  type SwigProposalRow,
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
  const [loans, setLoans] = useState<LoanRequestRow[]>([]);
  const [proposals, setProposals] = useState<SwigProposalRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [blinkBusy, setBlinkBusy] = useState(false);
  const [cycleEndBusy, setCycleEndBusy] = useState(false);
  const [loanBusy, setLoanBusy] = useState(false);
  const [swigBusy, setSwigBusy] = useState(false);
  const [voteLoanId, setVoteLoanId] = useState<string | null>(null);
  const [approveProposalId, setApproveProposalId] = useState<string | null>(null);

  const [loanSol, setLoanSol] = useState("0.1");
  const [loanReason, setLoanReason] = useState("");
  const [loanBorrowerId, setLoanBorrowerId] = useState("");
  const fallbackBorrowerId = memberId ?? group.members?.[0]?.id ?? "";
  const effectiveBorrowerId = loanBorrowerId || fallbackBorrowerId;

  const [swigTitle, setSwigTitle] = useState("Treasury action");
  const [swigKind, setSwigKind] = useState("emergency_loan");
  const [swigSol, setSwigSol] = useState("0.5");
  const [swigApprovals, setSwigApprovals] = useState(3);

  const load = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [c, y, b, bl, ln, sp] = await Promise.all([
        fetchGroupCycle(group.id),
        fetchGroupYield(group.id),
        walletAddress ? fetchWeb3Balance(walletAddress) : Promise.resolve(null),
        fetchBlinkActions(),
        fetchLoanRequests(group.id),
        fetchSwigProposals(group.id),
      ]);
      setCycle(c);
      setYieldData(y);
      setBalance(b);
      setBlinks(bl.filter((x) => x.group_id === group.id).slice(0, 20));
      setLoans(ln);
      setProposals(sp);
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

  const onEndCycle = async () => {
    setCycleEndBusy(true);
    setErr(null);
    try {
      await endGroupCycle(group.id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "End cycle failed");
    } finally {
      setCycleEndBusy(false);
    }
  };

  const onCreateLoan = async () => {
    const sol = Number(loanSol);
    if (!effectiveBorrowerId.trim() || !Number.isFinite(sol) || sol <= 0) {
      setErr("Loan needs a borrower member and positive SOL amount.");
      return;
    }
    setLoanBusy(true);
    setErr(null);
    try {
      await createLoanRequest(group.id, {
        borrower_member_id: effectiveBorrowerId.trim(),
        amount_lamports: solToLamports(sol),
        reason: loanReason.trim() || "Loan request",
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create loan failed");
    } finally {
      setLoanBusy(false);
    }
  };

  const onVoteLoan = async (loanId: string, vote: "approve" | "reject") => {
    if (!memberId || !walletAddress) {
      setErr("Join this circle to vote on loans.");
      return;
    }
    setVoteLoanId(loanId);
    setErr(null);
    try {
      await voteLoanRequest(group.id, loanId, { member_id: memberId, vote });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoteLoanId(null);
    }
  };

  const onCreateSwig = async () => {
    if (!memberId) {
      setErr("Join this circle to create a Swig proposal.");
      return;
    }
    const sol = Number(swigSol);
    if (!swigTitle.trim() || !Number.isFinite(sol) || sol <= 0) {
      setErr("Swig proposal needs a title and positive SOL amount.");
      return;
    }
    setSwigBusy(true);
    setErr(null);
    try {
      await createSwigProposal(group.id, {
        title: swigTitle.trim(),
        kind: swigKind.trim() || "emergency_loan",
        amount_lamports: solToLamports(sol),
        approvals_required: swigApprovals,
        created_by_member_id: memberId,
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create Swig proposal failed");
    } finally {
      setSwigBusy(false);
    }
  };

  const onApproveSwig = async (proposalId: string) => {
    if (!memberId || !walletAddress) {
      setErr("Join this circle to approve proposals.");
      return;
    }
    setApproveProposalId(proposalId);
    setErr(null);
    try {
      await approveSwigProposal(group.id, proposalId, { member_id: memberId, wallet: walletAddress });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setApproveProposalId(null);
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
            <button
              type="button"
              disabled={cycleEndBusy}
              onClick={() => void onEndCycle()}
              className="mt-3 w-full rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            >
              {cycleEndBusy ? "Ending cycle…" : "POST /cycle/end (settle & advance)"}
            </button>
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              Requires contributions recorded for the active cycle in the API.
            </p>
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
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Loans (vote flow)</h4>
            {loans.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No loan requests yet.</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-xs">
                {loans.map((l) => (
                  <li key={l.id} className="rounded border border-slate-200 p-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="font-mono">{l.id}</span>
                      <span>{l.status}</span>
                      <span>{lamportsToSol(l.amount_lamports)} SOL</span>
                      <span className="text-[var(--muted)]">borrower {l.borrower_member_id}</span>
                    </div>
                    {l.reason && <p className="mt-1 text-[var(--muted)]">{l.reason}</p>}
                    {l.status === "pending" && memberId && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={voteLoanId === l.id}
                          onClick={() => void onVoteLoan(l.id, "approve")}
                          className="rounded bg-emerald-700 px-2 py-0.5 text-[11px] text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={voteLoanId === l.id}
                          onClick={() => void onVoteLoan(l.id, "reject")}
                          className="rounded border border-slate-300 px-2 py-0.5 text-[11px] hover:bg-slate-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[10px] uppercase text-[var(--muted)]">Borrower member</label>
                <select
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  value={effectiveBorrowerId}
                  onChange={(e) => setLoanBorrowerId(e.target.value)}
                  disabled={!group.members?.length}
                >
                  {!group.members?.length ? (
                    <option value="">No members — refresh circles</option>
                  ) : null}
                  {(group.members ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id.slice(0, 10)}… ({m.wallet_address.slice(0, 4)}…)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--muted)]">Amount (SOL)</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  type="number"
                  step="any"
                  min="0"
                  value={loanSol}
                  onChange={(e) => setLoanSol(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="text-[10px] uppercase text-[var(--muted)]">Reason</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Why this loan"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={loanBusy || !(group.members?.length)}
              onClick={() => void onCreateLoan()}
              className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loanBusy ? "Creating…" : "Create loan request"}
            </button>
          </div>

          <div className="rounded-lg border border-[var(--border-strong)] bg-white p-3 md:col-span-2 lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">Swig proposals</h4>
            {proposals.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--muted)]">No Swig proposals yet.</p>
            ) : (
              <ul className="mt-2 max-h-40 space-y-2 overflow-auto text-xs">
                {proposals.map((p) => (
                  <li key={p.id} className="rounded border border-slate-200 p-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[var(--muted)]">
                      <span>{p.kind}</span>
                      <span>{lamportsToSol(p.amount_lamports)} SOL</span>
                      <span>
                        approvals {p.approvals_count}/{p.approvals_required}
                      </span>
                      <span>{p.status}</span>
                    </div>
                    {p.status === "pending" && memberId && (
                      <button
                        type="button"
                        disabled={approveProposalId === p.id}
                        onClick={() => void onApproveSwig(p.id)}
                        className="mt-2 rounded bg-indigo-700 px-2 py-0.5 text-[11px] text-white hover:bg-indigo-600 disabled:opacity-50"
                      >
                        {approveProposalId === p.id ? "Approving…" : "Approve"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <label className="text-[10px] uppercase text-[var(--muted)]">Title</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  value={swigTitle}
                  onChange={(e) => setSwigTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--muted)]">Kind</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  value={swigKind}
                  onChange={(e) => setSwigKind(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--muted)]">Amount (SOL)</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  type="number"
                  step="any"
                  value={swigSol}
                  onChange={(e) => setSwigSol(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-[var(--muted)]">Approvals required</label>
                <input
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  type="number"
                  min={1}
                  max={20}
                  value={swigApprovals}
                  onChange={(e) => setSwigApprovals(Number(e.target.value))}
                />
              </div>
            </div>
            <button
              type="button"
              disabled={swigBusy || !memberId}
              onClick={() => void onCreateSwig()}
              className="mt-2 rounded bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {swigBusy ? "Creating…" : "Create Swig proposal"}
            </button>
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
