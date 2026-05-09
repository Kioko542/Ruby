"use client";
import { useWalletConnection } from "@solana/react-hooks";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  const { connectors, connect, disconnect, wallet, status } =
    useWalletConnection();
  const searchParams = useSearchParams();

  const address = wallet?.account.address.toString();
  const backendBase = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080").replace(
        /\/$/,
        "",
      ),
    [],
  );

  const [groupID, setGroupID] = useState(searchParams.get("group") ?? "");
  const [memberID, setMemberID] = useState("");
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [referrerID, setReferrerID] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [solBalance, setSolBalance] = useState<null | {
    lamports: number;
    sol: number;
  }>(null);
  const [busy, setBusy] = useState(false);

  async function fetchBalance() {
    if (!address) {
      setApiMessage("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setApiMessage("");
    try {
      const res = await fetch(
        `${backendBase}/api/v1/web3/balance?address=${encodeURIComponent(address)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to fetch balance");
      }
      setSolBalance({ lamports: data.lamports, sol: data.sol });
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function joinGroup() {
    if (!groupID || !memberID || !address) {
      setApiMessage("group ID, member ID, and connected wallet are required.");
      return;
    }
    setBusy(true);
    setApiMessage("");
    try {
      const body: Record<string, string> = {
        member_id: memberID,
        wallet_address: address,
      };
      if (inviteCode) {
        body.invite_code = inviteCode;
      } else if (referrerID) {
        body.referrer_member_id = referrerID;
      }

      const res = await fetch(
        `${backendBase}/api/v1/groups/${encodeURIComponent(groupID)}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to join group");
      }
      setApiMessage(
        data.referral_applied
          ? "Joined successfully. Referral credited."
          : "Joined successfully.",
      );
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  async function createInviteLink() {
    if (!groupID || !memberID) {
      setApiMessage("group ID and your member ID are required.");
      return;
    }
    setBusy(true);
    setApiMessage("");
    try {
      const res = await fetch(
        `${backendBase}/api/v1/groups/${encodeURIComponent(groupID)}/invite-links`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referrer_member_id: memberID }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create invite link");
      }
      setInviteLink(data.invite_url);
      setInviteCode(data.invite_code);
      setApiMessage("Invite link generated.");
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-bg1 text-foreground">
      <main className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-10 border-x border-border-low px-6 py-16">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            Solana starter kit
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Ship a Solana dapp fast
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-muted">
            Drop in <code className="font-mono">@solana/react-hooks</code>, wrap
            your tree once, and you get wallet connect/disconnect plus
            ready-to-use hooks for balances and transactions—no manual RPC
            wiring. This scaffold is wired to the Go backend for group join +
            referral attribution.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://solana.com/docs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solana docs
                </a>{" "}
                — core concepts, RPC, programs, and client patterns.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://www.anchor-lang.com/docs/introduction"
                  target="_blank"
                  rel="noreferrer"
                >
                  Anchor docs
                </a>{" "}
                — build and test programs with IDL, macros, and type-safe
                clients.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Solana faucet (devnet)
                </a>{" "}
                — grab free devnet SOL to try transfers and transactions.
              </div>
            </li>
            <li className="flex gap-2">
              <span
                className="mt-1.5 h-2 w-2 rounded-full bg-foreground/60"
                aria-hidden
              />
              <div>
                <a
                  className="font-medium underline underline-offset-2"
                  href="https://github.com/solana-foundation/framework-kit/tree/main/packages/react-hooks"
                  target="_blank"
                  rel="noreferrer"
                >
                  @solana/react-hooks README
                </a>{" "}
                — how this starter wires the client, connectors, and hooks.
              </div>
            </li>
          </ul>
        </header>

        <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-lg font-semibold">Wallet connection</p>
              <p className="text-sm text-muted">
                Pick any discovered connector and manage connect / disconnect in
                one spot.
              </p>
            </div>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80">
              {status === "connected" ? "Connected" : "Not connected"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect(connector.id)}
                disabled={status === "connecting"}
                className="group flex items-center justify-between rounded-xl border border-border-low bg-card px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex flex-col">
                  <span className="text-base">{connector.name}</span>
                  <span className="text-xs text-muted">
                    {status === "connecting"
                      ? "Connecting…"
                      : status === "connected" &&
                          wallet?.connector.id === connector.id
                        ? "Active"
                        : "Tap to connect"}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full bg-border-low transition group-hover:bg-primary/80"
                />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-low pt-4 text-sm">
            <span className="rounded-lg border border-border-low bg-cream px-3 py-2 font-mono text-xs">
              {address ?? "No wallet connected"}
            </span>
            <button
              onClick={() => disconnect()}
              disabled={status !== "connected"}
              className="inline-flex items-center gap-2 rounded-lg border border-border-low bg-card px-3 py-2 font-medium transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Disconnect
            </button>
          </div>
        </section>

        <section className="w-full max-w-3xl space-y-4 rounded-2xl border border-border-low bg-card p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.35)]">
          <div className="space-y-1">
            <p className="text-lg font-semibold">Backend integration checks</p>
            <p className="text-sm text-muted">
              Uses the backend as source of truth for joins, invites, referrals,
              and wallet balance reads.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={groupID}
              onChange={(e) => setGroupID(e.target.value)}
              className="rounded-lg border border-border-low bg-bg1 px-3 py-2 text-sm"
              placeholder="Group ID"
            />
            <input
              value={memberID}
              onChange={(e) => setMemberID(e.target.value)}
              className="rounded-lg border border-border-low bg-bg1 px-3 py-2 text-sm"
              placeholder="Your member ID"
            />
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="rounded-lg border border-border-low bg-bg1 px-3 py-2 text-sm"
              placeholder="Invite code (optional)"
            />
            <input
              value={referrerID}
              onChange={(e) => setReferrerID(e.target.value)}
              className="rounded-lg border border-border-low bg-bg1 px-3 py-2 text-sm"
              placeholder="Referrer member ID (optional)"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchBalance}
              disabled={busy}
              className="rounded-lg border border-border-low px-3 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Fetch balance via backend
            </button>
            <button
              onClick={joinGroup}
              disabled={busy}
              className="rounded-lg border border-border-low px-3 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Join group
            </button>
            <button
              onClick={createInviteLink}
              disabled={busy}
              className="rounded-lg border border-border-low px-3 py-2 text-sm font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create invite link
            </button>
          </div>

          {solBalance && (
            <p className="text-sm text-muted">
              Backend balance: {solBalance.sol} SOL ({solBalance.lamports}{" "}
              lamports)
            </p>
          )}
          {inviteLink && (
            <p className="break-all text-sm text-muted">Invite URL: {inviteLink}</p>
          )}
          {apiMessage && <p className="text-sm text-foreground">{apiMessage}</p>}
        </section>
      </main>
    </div>
  );
}
