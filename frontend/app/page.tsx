"use client";
<<<<<<< HEAD
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
=======

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/layout/header";
import { LoginForm } from "@/components/auth/login-form";
import { Users, UserPlus, Bot, Shield, TrendingUp, Sparkles, CheckCircle2, Wallet } from "lucide-react";

const flowSteps = [
  {
    title: "Create group",
    description: "Launch a savings circle on-chain in seconds with group governance built in.",
    icon: Users,
  },
  {
    title: "Invite friends",
    description: "Share a link or code so everyone joins the same vault without manual tracking.",
    icon: UserPlus,
  },
  {
    title: "Autopilot yield",
    description: "Idle funds are deployed into DeFi yield protocols automatically.",
    icon: Bot,
  },
];

const trustLogos = ["Dev3pack", "Solana Devnet", "Hackathon 2026"];

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [interestEmail, setInterestEmail] = useState("");
  const router = useRouter();

  const handleLoginSuccess = () => {
    setShowLogin(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header onLoginClick={() => setShowLogin(true)} />
>>>>>>> 5fb2cf0 (creation of auth pages and dashboard overview)

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:py-16">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 shadow-sm">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Project Ruby · Dev3pack Hackathon 2026
            </div>

            {/* Hero Section */}
            <div className="space-y-6">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Save together. Earn yield. On autopilot.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Ruby turns a savings circle into a fully autonomous protocol. No admin, no manual tracking — just trustless group savings with AI-powered yield.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Dialog open={showLogin} onOpenChange={setShowLogin}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full bg-slate-950 text-white hover:bg-slate-900">
                    Start a Circle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <LoginForm onSuccess={handleLoginSuccess} />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg" className="rounded-full border-slate-300 text-slate-950 hover:bg-slate-100">
                Explore roadmap
              </Button>
            </div>

            {/* Flow Steps - Preserved original styling */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-4 md:grid-cols-3">
                {flowSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-950">{step.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How Ruby Works + Early Access */}
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              {/* How Ruby Works */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-950">How Ruby works</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Ruby replaces savings circle admin work with on-chain automation and an AI TreasuryAgent that grows group funds while members save together.
                </p>

                <div className="mt-8 grid gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-slate-950" />
                      <p className="text-sm font-semibold text-slate-950">Group vault</p>
                    </div>
                    <p className="text-sm text-slate-600">Every contribution is recorded on-chain and stored in a programmable vault.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-semibold text-slate-950">AI TreasuryAgent</p>
                    </div>
                    <p className="text-sm text-slate-600">Idle funds are automatically deployed to yield protocols automatically.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-semibold text-slate-950">Transparent history</p>
                    </div>
                    <p className="text-sm text-slate-600">All actions are verifiable on-chain, so the group can trust the protocol over any admin.</p>
                  </div>
                </div>
              </div>

              {/* Early Access Card - Preserved original */}
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950/5 p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Launch interest</p>
                  <p className="mt-4 text-2xl font-semibold text-slate-950">Get early access</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Enter your email and we’ll notify you once Ruby is ready for your first group.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={interestEmail}
                      onChange={(event) => setInterestEmail(event.target.value)}
                      placeholder="Email address"
                      className="flex-1 rounded-full border-slate-200 bg-white"
                    />
                    <Button className="rounded-full bg-slate-950 text-white hover:bg-slate-900">
                      Notify me
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preserved original structure */}
          <aside className="space-y-8">
            {/* Visual Card */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="aspect-[4/3] rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-950/5 via-white to-slate-50 p-6">
                <div className="flex h-full flex-col justify-between rounded-[1.5rem] p-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
                      Group circle
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-950">Autopilot savings</h2>
                    <p className="text-sm leading-6 text-slate-600">
                      Visualize the circle, your group vault, and AI yield working together.
                    </p>
                  </div>
                  <div className="grid gap-4 text-sm text-slate-600">
                    <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-950" />
                        <p className="font-semibold text-slate-950">Step 1</p>
                      </div>
                      <p>Create the group and invite trusted members.</p>
                    </div>
                    <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-slate-950" />
                        <p className="font-semibold text-slate-950">Step 2</p>
                      </div>
                      <p>Members contribute to the vault and the protocol tracks every deposit.</p>
                    </div>
                    <div className="rounded-3xl bg-white/90 p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-slate-950" />
                        <p className="font-semibold text-slate-950">Step 3</p>
                      </div>
                      <p>AI deploys idle funds into yield protocols automatically.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Proof Card - Preserved original */}
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Social proof</p>
              <p className="mt-4 text-xl font-semibold text-slate-950">Trusted by builders at Dev3pack</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Ruby combines group saving rituals with blockchain and AI, so circles move faster and earn yield while they save.
              </p>
              
              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap gap-2">
                {trustLogos.map((logo) => (
                  <span key={logo} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {logo}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Preview Card - New but matches dashboard style */}
            <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-5 w-5 text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Live Stats</p>
              </div>
              <p className="text-3xl font-bold">$44,218.40</p>
              <p className="text-sm opacity-80 mt-1">Total value locked</p>
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Active circles</span>
                  <span className="font-semibold">4</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="opacity-70">Average APY</span>
                  <span className="font-semibold text-green-400">7.24%</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

<<<<<<< HEAD
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
=======
        {/* Footer - Preserved original */}
        <footer className="mt-16 rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p>© 2026 Project Ruby — Dev3pack Hackathon</p>
            <div className="flex flex-wrap items-center gap-4 text-slate-500">
              <Button variant="ghost" size="sm" className="rounded-full text-slate-500 hover:bg-slate-100">
                Terms
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full text-slate-500 hover:bg-slate-100">
                Privacy
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full text-slate-500 hover:bg-slate-100">
                Status
              </Button>
            </div>
          </div>
        </footer>
>>>>>>> 5fb2cf0 (creation of auth pages and dashboard overview)
      </main>
    </div>
  );
}