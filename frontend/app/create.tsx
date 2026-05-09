"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuthStore } from "@/stores/auth-store";
import { buildTx, createGroup, joinGroup, solToLamports } from "@/lib/ruby-api";

function CreateInner() {
  const router = useRouter();
  const { walletAddress, principal } = useAuthStore();
  const displayWallet = walletAddress || principal?.wallet_address || "";

  const [name, setName] = useState("");
  const [contributionSol, setContributionSol] = useState("0.05");
  const [maxMembers, setMaxMembers] = useState(10);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayWallet) {
      setLog("You need a wallet on this session (Phantom or Privy embedded wallet).");
      return;
    }
    const sol = Number(contributionSol);
    if (!name.trim() || !Number.isFinite(sol) || sol <= 0) {
      setLog("Name and a positive SOL contribution are required.");
      return;
    }

    setBusy(true);
    setLog(null);
    try {
      const groupId = `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const lamports = solToLamports(sol);

      await createGroup({
        id: groupId,
        name: name.trim(),
        creator_wallet: displayWallet,
        contribution_amt: lamports,
        max_members: maxMembers,
      });

      const memberId = `m_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      await joinGroup(groupId, {
        member_id: memberId,
        wallet_address: displayWallet,
      });

      const plan = await buildTx("create-group", {
        group_id: groupId,
        wallet_address: displayWallet,
        amount: lamports,
      });
      setLog(
        `Circle created and you joined as ${memberId}. Anchor plan: ${plan.instruction_name} (see dashboard for full JSON).`,
      );
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err) {
      setLog(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-lg">
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 text-2xl font-semibold">Create a circle</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Persists to Postgres via the API, joins your wallet, and fetches an Anchor{" "}
          <code className="rounded bg-slate-100 px-1">create-group</code> tx plan.
        </p>

        {!displayWallet && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            No wallet on this session. Sign in with Phantom (recommended) or Privy with an embedded
            Solana wallet so the API can attach you as a member.
          </p>
        )}

        <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-4 rounded-xl border border-[var(--border-strong)] bg-[var(--card)] p-6 shadow-sm">
          <div>
            <label className="text-xs font-medium uppercase text-[var(--muted)]">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mama Chama Circle"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-[var(--muted)]">
              Contribution (SOL, devnet)
            </label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm"
              type="number"
              step="any"
              min="0.000000001"
              value={contributionSol}
              onChange={(e) => setContributionSol(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase text-[var(--muted)]">Max members</label>
            <input
              className="mt-1 w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm"
              type="number"
              min={2}
              max={200}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create & join"}
          </button>
        </form>

        {log && (
          <pre className="mt-6 whitespace-pre-wrap rounded-lg border border-[var(--border-strong)] bg-slate-50 p-4 text-xs">
            {log}
          </pre>
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <ProtectedRoute>
      <CreateInner />
    </ProtectedRoute>
  );
}
