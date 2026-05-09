"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";

const circles = [
  {
    initials: "MC",
    name: "Mama Chama Circle",
    members: 8,
    id: "RU-001",
    balance: "$12,400.00",
    yield: "+$88.24 yield",
    cycle: 4,
    total: 12,
    progress: 33,
    protocol: "Kamino",
    apy: "8.2%",
    status: "active",
  },
  {
    initials: "AP",
    name: "Alpha Pesa Pool",
    members: 5,
    id: "RU-002",
    balance: "$8,210.00",
    yield: "+$42.50 yield",
    cycle: 7,
    total: 12,
    progress: 58,
    protocol: "Jito",
    apy: "5.8%",
    status: "rebalancing",
  },
  {
    initials: "DL",
    name: "Delta Liquidity Fund",
    members: 10,
    id: "RU-003",
    balance: "$22,294.00",
    yield: "+$178.35 yield",
    cycle: 10,
    total: 12,
    progress: 83,
    protocol: "Kamino",
    apy: "12.4%",
    status: "active",
  },
  {
    initials: "SY",
    name: "Sigma Yield Collective",
    members: 6,
    id: "RU-004",
    balance: "$1,314.40",
    yield: "+$3.79 yield",
    cycle: 1,
    total: 12,
    progress: 8,
    protocol: "Jito",
    apy: "3.2%",
    status: "vote",
  },
];

const notifications = [
  { icon: "ti-trending-up", text: "Agent deposited $22,400 into Kamino at 12.4% APY", bold: "Agent deposited $22,400", time: "4 minutes ago" },
  { icon: "ti-user-check", text: "Fatuma Ochieng contributed $200 to Mama Chama Circle", bold: "Fatuma Ochieng", time: "1 hour ago" },
  { icon: "ti-file-invoice", text: "Loan request from James Mutua · your vote needed", bold: "Loan request", time: "3 hours ago" },
  { icon: "ti-coin", text: "$88.24 yield earned in Mama Chama Circle this cycle", bold: "$88.24 yield earned", time: "Yesterday" },
];

const statusBadge = (status: string) => {
  if (status === "active")
    return (
      <span className="badge badge-ok">
        <i className="ti ti-point-filled" style={{ fontSize: 9 }} />
        Active
      </span>
    );
  if (status === "rebalancing")
    return (
      <span className="badge badge-blue">
        <i className="ti ti-refresh" style={{ fontSize: 9 }} />
        Rebalancing
      </span>
    );
  if (status === "vote")
    return (
      <span className="badge badge-warn">
        <i className="ti ti-vote" style={{ fontSize: 9 }} />
        Vote pending
      </span>
    );
  return null;
};

export default function RubyDashboard() {
  const [search, setSearch] = useState("");
  const [scale, setScale] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const calculateScale = () => {
      const width = window.innerWidth;
      if (width < 1200) {
        const newScale = Math.max(0.85, width / 1440);
        setScale(newScale);
      } else if (width < 1366) {
        const newScale = Math.max(0.9, width / 1440);
        setScale(newScale);
      } else {
        setScale(1);
      }
    };
    
    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const filtered = circles.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  // Navigation handlers
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const handleCreateCircle = useCallback(() => {
    router.push("/create");
  }, [router]);

  const handleContributeNow = useCallback(() => {
    router.push("/groups/RU-001/contribute");
  }, [router]);

  const handleViewAgentLog = useCallback(() => {
    router.push("/agent/logs");
  }, [router]);

  const handleApproveVote = useCallback(() => {
    router.push("/governance/loans/RU-004/vote");
  }, [router]);

  const handleRejectVote = useCallback(() => {
    router.push("/governance/loans/RU-004/vote");
  }, [router]);

  const handleRowClick = useCallback((circleId: string) => {
    router.push(`/groups/${circleId}`);
  }, [router]);

  const handleCircleClick = useCallback((circleName: string) => {
    const circle = circles.find(c => c.name === circleName);
    if (circle) {
      router.push(`/groups/${circle.id}`);
    }
  }, [router]);

  const filteredCircles = circles.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          background: #FFFFFF; 
          color: #111; 
          overflow-x: hidden;
          min-width: 1280px;
        }
        
        .scale-container {
          transform-origin: top left;
          width: 1440px;
          min-width: 1440px;
        }
        
        .app { display: flex; min-height: 100vh; background: #FFFFFF; width: 100%; }

        /* ── Sidebar ── */
        .sidebar { width: 210px; min-width: 210px; border-right: 1px solid #e8e8e6; display: flex; flex-direction: column; background: #FFFFFF; }
        .logo { padding: 18px 20px; display: flex; align-items: center; gap: 9px; border-bottom: 1px solid #e8e8e6; }
        .logomark { width: 26px; height: 26px; background: #111; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; }
        .logoname { font-size: 14px; font-weight: 700; color: #111; letter-spacing: -0.3px; }
        .nav { flex: 1; padding: 12px 0; }
        .nav-section { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #a0a09a; padding: 12px 20px 6px; }
        .ni { display: flex; align-items: center; gap: 9px; padding: 7px 20px; font-size: 12.5px; font-weight: 500; color: #6b6b66; cursor: pointer; border-left: 2px solid transparent; transition: all .12s; text-decoration: none; }
        .ni:hover { background: #f7f6f3; color: #111; }
        .ni.active { background: #f7f6f3; color: #111; border-left-color: #111; font-weight: 600; }
        .ni i { font-size: 15px; opacity: .75; }
        .ni.active i { opacity: 1; }
        .sf { padding: 14px 20px; border-top: 1px solid #e8e8e6; display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .sf:hover { background: #f7f6f3; }
        .av { width: 28px; height: 28px; border-radius: 50%; background: #111; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .av-name { font-size: 12px; font-weight: 600; color: #111; }
        .av-sub { font-size: 10px; color: #a0a09a; }

        /* ── Main ── */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow-x: visible; background: #FFFFFF; }
        .topbar { padding: 18px 28px; border-bottom: 1px solid #e8e8e6; display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; }
        .page-h { font-size: 18px; font-weight: 700; color: #111; letter-spacing: -0.4px; }
        .page-s { font-size: 12px; color: #a0a09a; margin-top: 2px; }
        .hactions { display: flex; gap: 8px; align-items: center; }
        .search-w { position: relative; }
        .search-w i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #a0a09a; pointer-events: none; }
        .sinput { height: 34px; padding: 0 12px 0 32px; border: 1px solid #e8e8e6; border-radius: 8px; font-size: 12px; width: 190px; background: #fafaf9; color: #111; outline: none; }
        .sinput:focus { background: #fff; border-color: #bbb; }
        .btn-p { height: 34px; padding: 0 14px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .btn-p i { font-size: 13px; }
        .btn-p:hover { background: #333; }

        /* ── Stats bar ── */
        .statsbar { display: flex; align-items: stretch; border-bottom: 1px solid #e8e8e6; background: #FFFFFF; }
        .sc { flex: 1; padding: 14px 20px; border-right: 1px solid #e8e8e6; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: background 0.2s; }
        .sc:hover { background: #fafaf9; }
        .sc:last-child { border-right: none; }
        .sc-icon { width: 32px; height: 32px; border-radius: 8px; background: #f4f3f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sc-icon i { font-size: 16px; color: #555; }
        .sc-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #a0a09a; }
        .sc-val { font-size: 16px; font-weight: 700; color: #111; letter-spacing: -0.4px; line-height: 1.2; display: flex; align-items: center; gap: 4px; }
        .sc-sub { font-size: 10.5px; color: #a0a09a; margin-top: 1px; }
        .sc-sub.up { color: #2d7a2d; }
        .pulse { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #2d7a2d; animation: pulse 1.8s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* ── Due bar ── */
        .due-bar { background: #111; border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin: 16px 28px 0; }
        .due-l { display: flex; align-items: center; gap: 10px; }
        .due-icon { width: 30px; height: 30px; background: rgba(255,255,255,.1); border-radius: 7px; display: flex; align-items: center; justify-content: center; }
        .due-icon i { font-size: 15px; color: #fff; }
        .due-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; color: #666; }
        .due-amt { font-size: 15px; font-weight: 700; color: #fff; margin-top: 1px; }
        .due-meta { font-size: 10.5px; color: #555; margin-top: 1px; }
        .btn-cta { height: 32px; padding: 0 14px; background: #fff; color: #111; border: none; border-radius: 7px; font-size: 11.5px; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .btn-cta:hover { background: #f0efe9; }

        /* ── Content grid ── */
        .content-inner { padding: 20px 28px 28px; }
        .content { display: grid; grid-template-columns: 1fr 284px; gap: 20px; align-items: start; }

        /* ── Table card ── */
        .card { background: #fff; border: 1px solid #e8e8e6; border-radius: 12px; overflow: hidden; }
        .ch { padding: 14px 18px; border-bottom: 1px solid #f0efe9; display: flex; align-items: center; justify-content: space-between; }
        .ch-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111; display: flex; align-items: center; gap: 7px; }
        .ch-title i { font-size: 14px; color: #888; }
        .btnsm { height: 28px; padding: 0 10px; border: 1px solid #e8e8e6; border-radius: 6px; font-size: 11px; font-weight: 600; background: #fff; cursor: pointer; color: #555; display: flex; align-items: center; gap: 4px; }
        .btnsm i { font-size: 12px; }
        .btnsm:hover { background: #f7f6f3; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th { padding: 9px 18px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #a0a09a; text-align: left; background: #fafaf9; white-space: nowrap; }
        td { padding: 13px 18px; font-size: 12.5px; border-top: 1px solid #f4f3f0; color: #444; vertical-align: middle; cursor: pointer; }
        tr:hover td { background: #fafaf9; }
        .circ-av { width: 34px; height: 34px; border-radius: 8px; background: #f0efe9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #555; flex-shrink: 0; }
        .flex-r { display: flex; align-items: center; gap: 10px; }
        .cname { font-size: 13px; font-weight: 600; color: #111; }
        .cmeta { font-size: 10.5px; color: #a0a09a; margin-top: 1px; }
        .pb-wrap { display: flex; flex-direction: column; gap: 3px; }
        .pb { width: 72px; height: 3px; background: #eeede8; border-radius: 99px; overflow: hidden; }
        .pbf { height: 100%; border-radius: 99px; background: #111; }
        .pb-t { font-size: 10px; color: #a0a09a; }
        .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 7px; border-radius: 99px; font-size: 10.5px; font-weight: 600; white-space: nowrap; }
        .badge-ok { background: #f0f7f0; color: #2d6a2d; }
        .badge-blue { background: #f0f4fb; color: #2a4ea0; }
        .badge-warn { background: #fdf6ed; color: #8a5a0a; }
        .yd { font-size: 12px; font-weight: 700; color: #111; }
        .ys { font-size: 10px; color: #a0a09a; }
        .acbtn { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border-radius: 6px; border: 1px solid #e8e8e6; background: #fff; cursor: pointer; color: #bbb; font-size: 13px; }
        .acbtn:hover { background: #f7f6f3; color: #555; }
        .pag { padding: 10px 18px; border-top: 1px solid #f0efe9; display: flex; align-items: center; justify-content: space-between; }
        .pag-t { font-size: 11px; color: #a0a09a; font-weight: 500; }
        .pag-btns { display: flex; gap: 3px; }
        .pb2 { width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e8e8e6; background: #fff; cursor: pointer; font-size: 11px; font-weight: 600; color: #555; display: flex; align-items: center; justify-content: center; }
        .pb2.cur { background: #111; color: #fff; border-color: #111; }
        .pb2:disabled { opacity: .3; cursor: not-allowed; }
        .pb2 i { font-size: 12px; }

        /* ── Right column ── */
        .right { display: flex; flex-direction: column; gap: 16px; }

        /* ── Agent card ── */
        .agent-card { background: #111; border-radius: 12px; padding: 18px; color: #fff; cursor: pointer; transition: transform 0.2s; }
        .agent-card:hover { transform: translateY(-2px); }
        .ac-hd { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .ac-icon { width: 24px; height: 24px; background: #333; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
        .ac-icon i { font-size: 13px; color: #ccc; }
        .ac-label { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #888; }
        .ac-yield { font-size: 26px; font-weight: 700; letter-spacing: -1px; color: #fff; line-height: 1; }
        .ac-ysub { font-size: 10.5px; color: #555; margin-top: 2px; margin-bottom: 12px; }
        .ac-rows { display: flex; flex-direction: column; gap: 5px; }
        .ac-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 9px; background: rgba(255,255,255,.05); border-radius: 6px; }
        .ac-row-l { font-size: 11px; color: #999; display: flex; align-items: center; gap: 6px; }
        .ac-row-l i { font-size: 12px; color: #666; }
        .ac-row-v { font-size: 11px; color: #e8e8e8; font-weight: 700; }
        .ac-foot { margin-top: 12px; padding-top: 11px; border-top: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 700; color: #666; cursor: pointer; }
        .ac-foot i { font-size: 12px; }
        .ac-foot:hover { color: #999; }

        /* ── Vote card ── */
        .vote-card { background: #fff; border: 1px solid #e8e8e6; border-radius: 12px; overflow: hidden; }
        .vc-hd { padding: 12px 16px; border-bottom: 1px solid #f0efe9; display: flex; justify-content: space-between; align-items: center; }
        .vc-t { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111; display: flex; align-items: center; gap: 6px; }
        .vc-t i { font-size: 14px; color: #888; }
        .vc-b { padding: 14px 16px; }
        .vreq { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .vname { font-size: 12.5px; font-weight: 600; color: #111; }
        .vsub { font-size: 10.5px; color: #a0a09a; }
        .vamt { font-size: 20px; font-weight: 700; color: #111; letter-spacing: -0.5px; }
        .vreason { font-size: 11px; color: #777; margin-bottom: 9px; }
        .vprog-lbl { display: flex; justify-content: space-between; font-size: 10px; color: #a0a09a; margin-bottom: 4px; }
        .vpbar { width: 100%; height: 4px; background: #f0efe9; border-radius: 99px; overflow: hidden; margin-bottom: 11px; }
        .vpfill { height: 100%; border-radius: 99px; background: #111; width: 60%; }
        .vbtns { display: flex; gap: 7px; }
        .btn-approve { flex: 1; height: 32px; border-radius: 7px; border: none; background: #111; color: #fff; font-size: 11.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .btn-approve i { font-size: 13px; }
        .btn-approve:hover { background: #333; }
        .btn-reject { flex: 1; height: 32px; border-radius: 7px; border: 1px solid #e8e8e6; background: #fff; color: #666; font-size: 11.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .btn-reject i { font-size: 13px; }
        .btn-reject:hover { background: #f7f6f3; }

        /* ── Notifications ── */
        .notif-card { background: #fafaf9; border: 1px solid #e8e8e6; border-radius: 12px; padding: 14px 16px; }
        .nc-t { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .nc-t i { font-size: 14px; color: #888; }
        .ni2 { display: flex; align-items: flex-start; gap: 9px; padding: 8px 0; border-bottom: 1px solid #eeecea; cursor: pointer; transition: background 0.2s; }
        .ni2:hover { background: #f5f5f2; margin: 0 -8px; padding: 8px 8px; border-radius: 8px; }
        .ni2:last-child { border-bottom: none; padding-bottom: 0; }
        .ni2-icon { width: 26px; height: 26px; border-radius: 6px; background: #f0efe9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
        .ni2-icon i { font-size: 13px; color: #666; }
        .ni2-text { font-size: 11.5px; color: #555; line-height: 1.45; }
        .ni2-text strong { color: #111; font-weight: 600; }
        .ni2-time { font-size: 10px; color: #bbb; margin-top: 2px; }
      `}</style>

      <div 
        className="scale-container" 
        style={{ 
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
          transformOrigin: 'top left'
        }}
      >
        <div className="app">
          {/* Sidebar with Navigation */}
          <div className="sidebar">
            <div className="logo" onClick={() => handleNavigate("/")}>
              <div className="logomark">R</div>
              <span className="logoname">Ruby</span>
            </div>
            <div className="nav">
              <div className="nav-section">Main</div>
              <a className="ni active" onClick={() => handleNavigate("/dashboard")}><i className="ti ti-layout-dashboard" /> Overview</a>
              <a className="ni" onClick={() => handleNavigate("/groups")}><i className="ti ti-users-group" /> My circles</a>
              <a className="ni" onClick={() => handleNavigate("/yield/history")}><i className="ti ti-chart-line" /> Yield history</a>
              <a className="ni" onClick={() => handleNavigate("/activity")}><i className="ti ti-bell" /> Activity</a>
              <div className="nav-section">Governance</div>
              <a className="ni" onClick={() => handleNavigate("/governance/loans")}><i className="ti ti-file-invoice" /> Loan requests</a>
              <a className="ni" onClick={() => handleNavigate("/blinks")}><i className="ti ti-link" /> Blinks</a>
              <div className="nav-section">Account</div>
              <a className="ni" onClick={() => handleNavigate("/wallet")}><i className="ti ti-wallet" /> My wallet</a>
              <a className="ni" onClick={() => handleNavigate("/settings")}><i className="ti ti-settings" /> Settings</a>
            </div>
            <div className="sf" onClick={() => handleNavigate("/profile")}>
              <div className="av">AK</div>
              <div>
                <div className="av-name">Amara Kioni</div>
                <div className="av-sub">Devnet · 6Xp7…3fKL</div>
              </div>
            </div>
          </div>

          {/* Main */}
          <div className="main">
            {/* Top bar */}
            <div className="topbar">
              <div>
                <div className="page-h">Portfolio overview</div>
                <div className="page-s">Autonomous savings on Solana · AI-managed treasury</div>
              </div>
              <div className="hactions">
                <div className="search-w">
                  <i className="ti ti-search" />
                  <input
                    className="sinput"
                    placeholder="Search circles…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn-p" onClick={handleCreateCircle}>
                  <i className="ti ti-plus" />
                  New circle
                </button>
              </div>
            </div>

            {/* Stats bar - Clickable */}
            <div className="statsbar">
              <div className="sc" onClick={() => handleNavigate("/stats/total-value")}>
                <div className="sc-icon"><i className="ti ti-building-bank" /></div>
                <div>
                  <div className="sc-label">Total vault value</div>
                  <div className="sc-val">$44,218.40</div>
                  <div className="sc-sub up">↑ 2.1% this week</div>
                </div>
              </div>
              <div className="sc" onClick={() => handleNavigate("/stats/apy")}>
                <div className="sc-icon"><i className="ti ti-trending-up" /></div>
                <div>
                  <div className="sc-label">Agent APY</div>
                  <div className="sc-val">7.24%</div>
                  <div className="sc-sub">Weighted avg</div>
                </div>
              </div>
              <div className="sc" onClick={() => handleNavigate("/groups")}>
                <div className="sc-icon"><i className="ti ti-circles-relation" /></div>
                <div>
                  <div className="sc-label">Active circles</div>
                  <div className="sc-val">4</div>
                  <div className="sc-sub">2 Kamino · 2 Jito</div>
                </div>
              </div>
              <div className="sc" onClick={() => handleNavigate("/stats/yield")}>
                <div className="sc-icon"><i className="ti ti-coin" /></div>
                <div>
                  <div className="sc-label">Yield this cycle</div>
                  <div className="sc-val">$312.88</div>
                  <div className="sc-sub up">↑ $88.24 today</div>
                </div>
              </div>
              <div className="sc" onClick={() => handleNavigate("/agent/status")}>
                <div className="sc-icon"><i className="ti ti-robot" /></div>
                <div>
                  <div className="sc-label">Agent status</div>
                  <div className="sc-val">
                    <span className="pulse" />
                    Active
                  </div>
                  <div className="sc-sub">Last run 4m ago</div>
                </div>
              </div>
            </div>

            {/* Contribution due banner */}
            <div className="due-bar">
              <div className="due-l">
                <div className="due-icon"><i className="ti ti-calendar-due" /></div>
                <div>
                  <div className="due-label">Next contribution due</div>
                  <div className="due-amt">$200.00 → Mama Chama Circle</div>
                  <div className="due-meta">Due in 2 days · Cycle 4 of 12</div>
                </div>
              </div>
              <button className="btn-cta" onClick={handleContributeNow}>Contribute now</button>
            </div>

            {/* Content */}
            <div className="content-inner">
              <div className="content">
                {/* Table */}
                <div className="card">
                  <div className="ch">
                    <div className="ch-title">
                      <i className="ti ti-stack-2" /> Active allocations
                    </div>
                    <button className="btnsm" onClick={() => handleNavigate("/groups/filter")}>
                      <i className="ti ti-adjustments-horizontal" /> Filter
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: "34%" }}>Circle</th>
                          <th style={{ width: "17%" }}>Vault balance</th>
                          <th style={{ width: "13%" }}>Cycle</th>
                          <th style={{ width: "12%" }}>Protocol</th>
                          <th style={{ width: "14%" }}>Status</th>
                          <th style={{ width: "10%", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCircles.map((c) => (
                          <tr key={c.id} onClick={() => handleRowClick(c.id)}>
                            <td>
                              <div className="flex-r">
                                <div className="circ-av">{c.initials}</div>
                                <div>
                                  <div className="cname">{c.name}</div>
                                  <div className="cmeta">{c.members} members · {c.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{c.balance}</div>
                              <div style={{ fontSize: 10.5, color: "#a0a09a" }}>{c.yield}</div>
                            </td>
                            <td>
                              <div className="pb-wrap">
                                <div className="pb"><div className="pbf" style={{ width: `${c.progress}%` }} /></div>
                                <div className="pb-t">{c.cycle} / {c.total}</div>
                              </div>
                            </td>
                            <td>
                              <div className="yd">{c.protocol}</div>
                              <div className="ys">{c.apy} APY</div>
                            </td>
                            <td>{statusBadge(c.status)}</td>
                            <td style={{ textAlign: "right" }}>
                              <button className="acbtn" onClick={(e) => { e.stopPropagation(); handleNavigate(`/groups/${c.id}/menu`); }}><i className="ti ti-dots" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pag">
                    <span className="pag-t">Showing 1–{filteredCircles.length} of {filteredCircles.length} circles</span>
                    <div className="pag-btns">
                      <button className="pb2" disabled><i className="ti ti-chevron-left" /></button>
                      <button className="pb2 cur">1</button>
                      <button className="pb2" disabled><i className="ti ti-chevron-right" /></button>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="right">
                  {/* AI Agent card */}
                  <div className="agent-card" onClick={handleViewAgentLog}>
                    <div className="ac-hd">
                      <div className="ac-icon"><i className="ti ti-cpu" /></div>
                      <span className="ac-label">AI TreasuryAgent</span>
                    </div>
                    <div className="ac-yield">$312.88</div>
                    <div className="ac-ysub">Total yield earned this cycle · auto-deployed</div>
                    <div className="ac-rows">
                      <div className="ac-row">
                        <span className="ac-row-l"><i className="ti ti-building-bank" />Kamino deployment</span>
                        <span className="ac-row-v">$31,014.00</span>
                      </div>
                      <div className="ac-row">
                        <span className="ac-row-l"><i className="ti ti-building-bank" />Jito deployment</span>
                        <span className="ac-row-v">$8,574.00</span>
                      </div>
                      <div className="ac-row">
                        <span className="ac-row-l"><i className="ti ti-droplet" />Liquidity reserve</span>
                        <span className="ac-row-v">$4,421.84</span>
                      </div>
                    </div>
                    <div className="ac-foot">
                      <i className="ti ti-arrow-up-right" /> View agent log
                    </div>
                  </div>

                  {/* Loan vote card */}
                  <div className="vote-card">
                    <div className="vc-hd">
                      <div className="vc-t"><i className="ti ti-file-invoice" /> Loan request</div>
                      <span className="badge badge-warn">
                        <i className="ti ti-alert-circle" style={{ fontSize: 9 }} />
                        Your vote needed
                      </span>
                    </div>
                    <div className="vc-b">
                      <div className="vreq">
                        <div className="circ-av" style={{ width: 30, height: 30, fontSize: 10 }}>JM</div>
                        <div>
                          <div className="vname">James Mutua</div>
                          <div className="vsub">Sigma Yield Collective</div>
                        </div>
                      </div>
                      <div className="vamt">$500.00 USDC</div>
                      <div className="vreason">Emergency medical expense · 30-day repayment</div>
                      <div className="vprog-lbl">
                        <span>3 of 5 approvals needed</span>
                        <span style={{ fontWeight: 700, color: "#111" }}>60%</span>
                      </div>
                      <div className="vpbar"><div className="vpfill" /></div>
                      <div className="vbtns">
                        <button className="btn-approve" onClick={handleApproveVote}><i className="ti ti-check" /> Approve</button>
                        <button className="btn-reject" onClick={handleRejectVote}><i className="ti ti-x" /> Reject</button>
                      </div>
                    </div>
                  </div>

                  {/* Notifications - Clickable */}
                  <div className="notif-card">
                    <div className="nc-t"><i className="ti ti-activity" /> Live updates</div>
                    {notifications.map((n, i) => (
                      <div className="ni2" key={i} onClick={() => handleNavigate("/activity")}>
                        <div className="ni2-icon"><i className={`ti ${n.icon}`} /></div>
                        <div>
                          <div className="ni2-text">
                            <strong>{n.bold}</strong>
                            {n.text.replace(n.bold, "")}
                          </div>
                          <div className="ni2-time">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </>
    </ProtectedRoute>
  );
}