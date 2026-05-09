// app/groups/create/page.tsx - Complete working dashboard
"use client";

import { useState, useEffect } from "react";

// Mock data
const initialCircles = [
  {
    id: "RU-001",
    initials: "MC",
    name: "Mama Chama Circle",
    members: 8,
    balance: 12400,
    balanceFormatted: "$12,400.00",
    yield: 88.24,
    yieldFormatted: "+$88.24 yield",
    cycle: 4,
    total: 12,
    progress: 33,
    protocol: "Kamino",
    apy: "8.2%",
    status: "active",
    membersList: ["Amara K.", "Fatuma O.", "James M.", "Alice W.", "Bob K.", "Carol N.", "David M.", "Eve K."]
  },
  {
    id: "RU-002",
    initials: "AP",
    name: "Alpha Pesa Pool",
    members: 5,
    balance: 8210,
    balanceFormatted: "$8,210.00",
    yield: 42.50,
    yieldFormatted: "+$42.50 yield",
    cycle: 7,
    total: 12,
    progress: 58,
    protocol: "Jito",
    apy: "5.8%",
    status: "rebalancing",
    membersList: ["Amara K.", "Peter O.", "John M.", "Sarah W.", "Mike K."]
  },
  {
    id: "RU-003",
    initials: "DL",
    name: "Delta Liquidity Fund",
    members: 10,
    balance: 22294,
    balanceFormatted: "$22,294.00",
    yield: 178.35,
    yieldFormatted: "+$178.35 yield",
    cycle: 10,
    total: 12,
    progress: 83,
    protocol: "Kamino",
    apy: "12.4%",
    status: "active",
    membersList: ["Amara K.", "Alice W.", "Bob K.", "Carol N.", "David M.", "Eve K.", "Frank O.", "Grace M.", "Henry W.", "Ivy N."]
  },
  {
    id: "RU-004",
    initials: "SY",
    name: "Sigma Yield Collective",
    members: 6,
    balance: 1314.40,
    balanceFormatted: "$1,314.40",
    yield: 3.79,
    yieldFormatted: "+$3.79 yield",
    cycle: 1,
    total: 12,
    progress: 8,
    protocol: "Jito",
    apy: "3.2%",
    status: "vote",
    membersList: ["Amara K.", "James M.", "Fatuma O.", "Peter O.", "John M.", "Sarah W."]
  },
];

const recentActivity = [
  { id: 1, type: "deposit", user: "Fatuma Ochieng", amount: 200, circle: "Mama Chama Circle", time: "1 hour ago", txHash: "5xP7...3fKL" },
  { id: 2, type: "yield", amount: 88.24, circle: "Mama Chama Circle", protocol: "Kamino", time: "4 hours ago", txHash: "8yR2...9jMN" },
  { id: 3, type: "deploy", amount: 22400, circle: "Delta Liquidity Fund", protocol: "Kamino", apy: "12.4%", time: "1 day ago", txHash: "2wQ4...7kTp" },
  { id: 4, type: "vote", user: "James Mutua", amount: 500, circle: "Sigma Yield Collective", purpose: "Emergency medical expense", time: "2 days ago" },
  { id: 5, type: "contribution", user: "Alice Wanjiku", amount: 200, circle: "Alpha Pesa Pool", time: "3 days ago", txHash: "9uZ6...1vBn" },
];

const yieldHistory = [
  { week: "Week 1", yield: 45.20, total: 4520 },
  { week: "Week 2", yield: 67.80, total: 4587.80 },
  { week: "Week 3", yield: 52.40, total: 4640.20 },
  { week: "Week 4", yield: 88.24, total: 4728.44 },
  { week: "Week 5", yield: 94.50, total: 4822.94 },
  { week: "Week 6", yield: 112.30, total: 4935.24 },
];

type CircleFormData = {
  name: string;
  description: string;
  contributionAmount: string;
  cycleLength: string;
  protocol: string;
};

type Circle = (typeof initialCircles)[number];

type CircleTransactionResult = {
  success: boolean;
  transactionId: string;
  circleId: string;
  circle: Circle;
};

const statusBadge = (status: string) => {
  if (status === "active") return <span className="badge badge-ok"><i className="ti ti-point-filled" />Active</span>;
  if (status === "rebalancing") return <span className="badge badge-blue"><i className="ti ti-refresh" />Rebalancing</span>;
  if (status === "vote") return <span className="badge badge-warn"><i className="ti ti-vote" />Vote pending</span>;
  return null;
};

// Mock transaction function
const createCircleOnChain = async (circleData: CircleFormData) => {
  return new Promise<CircleTransactionResult>((resolve) => {
    setTimeout(() => {
      const newId = `RU-${Math.floor(Math.random() * 900 + 100)}`;
      resolve({
        success: true,
        transactionId: `tx_${Math.random().toString(36).substr(2, 16)}`,
        circleId: newId,
        circle: {
          id: newId,
          initials: circleData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          name: circleData.name,
          members: 1,
          balance: parseFloat(circleData.contributionAmount),
          balanceFormatted: `$${parseFloat(circleData.contributionAmount).toLocaleString()}.00`,
          yield: 0,
          yieldFormatted: "+$0.00 yield",
          cycle: 1,
          total: parseInt(circleData.cycleLength),
          progress: Math.round((1 / parseInt(circleData.cycleLength)) * 100),
          protocol: circleData.protocol,
          apy: circleData.protocol === "Kamino" ? "8.2%" : "5.8%",
          status: "active",
          membersList: ["You (Creator)"]
        }
      });
    }, 1500);
  });
};

export default function CompleteDashboard() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("circles"); // circles, yield, activity
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [circles, setCircles] = useState(initialCircles);
  const [step, setStep] = useState(1);
  const [transactionResult, setTransactionResult] = useState<CircleTransactionResult | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "200",
    cycleLength: "12",
    protocol: "Kamino",
  });

  // Load circles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ruby_circles');
    if (saved) {
      queueMicrotask(() => setCircles(JSON.parse(saved)));
    }
  }, []);

  // Save circles to localStorage when updated
  useEffect(() => {
    localStorage.setItem('ruby_circles', JSON.stringify(circles));
  }, [circles]);

  const filteredCircles = circles.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = circles.reduce((sum, c) => sum + c.balance, 0);
  const totalYield = circles.reduce((sum, c) => sum + c.yield, 0);
  const avgApy = (circles.reduce((sum, c) => sum + parseFloat(c.apy), 0) / circles.length).toFixed(1);

  const handleCreateCircle = () => {
    setShowCreateForm(true);
    setStep(1);
    setTransactionResult(null);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleConfirmTransaction = async () => {
    setIsProcessing(true);
    try {
      const result = await createCircleOnChain(formData);
      setTransactionResult(result);
      
      // Add new circle to state
      setCircles(prev => [...prev, result.circle]);
      
      setStep(3);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setShowCreateForm(false);
    setFormData({ name: "", description: "", contributionAmount: "200", cycleLength: "12", protocol: "Kamino" });
    setStep(1);
  };

  const handleContribute = (circleId: string) => {
    alert(`Contribution flow for ${circleId} - Would connect to Stripe/solana pay`);
  };

  if (showCreateForm) {
    if (step === 3 && transactionResult) {
      return (
        <>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
          <style>{`
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFFFFF; }
            .success-container { max-width: 500px; margin: 80px auto; padding: 40px 24px; text-align: center; }
            .success-card { background: #fff; border: 1px solid #e8e8e6; border-radius: 16px; padding: 48px 32px; }
            .success-icon { width: 64px; height: 64px; background: #f0f7f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
            .success-icon i { font-size: 32px; color: #2d6a2d; }
            .success-title { font-size: 24px; font-weight: 700; color: #111; margin-bottom: 8px; }
            .tx-details { background: #fafaf9; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: left; }
            .tx-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
            .btn-group { display: flex; gap: 12px; margin-top: 24px; }
            .btn-primary { flex: 1; padding: 12px; background: #111; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
            .btn-secondary { flex: 1; padding: 12px; background: #fff; border: 1px solid #e8e8e6; border-radius: 8px; cursor: pointer; }
          `}</style>
          <div className="success-container">
            <div className="success-card">
              <div className="success-icon"><i className="ti ti-check" /></div>
              <div className="success-title">Circle created!</div>
              <div className="tx-details">
                <div className="tx-row"><span>Circle ID</span><strong>{transactionResult.circleId}</strong></div>
                <div className="tx-row"><span>Transaction</span><strong>{transactionResult.transactionId.slice(0, 16)}...</strong></div>
                <div className="tx-row"><span>Network</span><strong>Solana Devnet</strong></div>
              </div>
              <div className="btn-group">
                <button className="btn-secondary" onClick={handleReset}>Dashboard</button>
                <button className="btn-primary" onClick={handleReset}>View circle →</button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFFFFF; }
          .create-container { max-width: 600px; margin: 40px auto; padding: 24px; }
          .card { background: #fff; border: 1px solid #e8e8e6; border-radius: 12px; overflow: hidden; }
          .card-header { padding: 20px 24px; border-bottom: 1px solid #f0efe9; }
          .card-title { font-size: 18px; font-weight: 700; color: #111; }
          .card-content { padding: 24px; }
          .form-group { margin-bottom: 20px; }
          label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #a0a09a; margin-bottom: 8px; }
          input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid #e8e8e6; border-radius: 8px; font-size: 13px; background: #fafaf9; }
          .tx-summary { background: #fafaf9; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .tx-summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e8e8e6; }
          .btn-primary { width: 100%; padding: 12px; background: #111; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
          .btn-primary:disabled { opacity: 0.5; }
          .back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px; color: #a0a09a; cursor: pointer; }
          .loading-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="create-container">
          <a className="back-link" onClick={handleReset}><i className="ti ti-arrow-left" /> Back to dashboard</a>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Create new circle</div>
            </div>
            <div className="card-content">
              {step === 1 ? (
                <form onSubmit={handleSubmitForm}>
                  <div className="form-group">
                    <label>Circle name</label>
                    <input type="text" placeholder="e.g., Mama Chama Circle" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea rows={2} placeholder="What's this circle for?" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Initial contribution (USDC)</label>
                    <input type="number" step="1" value={formData.contributionAmount} onChange={(e) => setFormData({...formData, contributionAmount: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Cycle length</label>
                    <select value={formData.cycleLength} onChange={(e) => setFormData({...formData, cycleLength: e.target.value})}>
                      <option value="6">6 months</option>
                      <option value="12">12 months</option>
                      <option value="24">24 months</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Yield protocol</label>
                    <select value={formData.protocol} onChange={(e) => setFormData({...formData, protocol: e.target.value})}>
                      <option value="Kamino">Kamino - ~8.2% APY</option>
                      <option value="Jito">Jito - ~5.8% APY</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-primary">Review transaction <i className="ti ti-arrow-right" /></button>
                </form>
              ) : (
                <div>
                  <div className="tx-summary">
                    <div className="tx-summary-row"><span>Circle name</span><strong>{formData.name}</strong></div>
                    <div className="tx-summary-row"><span>Initial contribution</span><strong>${formData.contributionAmount} USDC</strong></div>
                    <div className="tx-summary-row"><span>Cycle</span><strong>{formData.cycleLength} months</strong></div>
                    <div className="tx-summary-row"><span>Protocol</span><strong>{formData.protocol}</strong></div>
                    <div className="tx-summary-row"><span>Network fee</span><strong>~0.0005 SOL</strong></div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '2px solid #e8e8e6', fontWeight: 700 }}>Total: ${formData.contributionAmount} USDC + fees</div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button className="btn-primary" onClick={handleConfirmTransaction} disabled={isProcessing} style={{ flex: 1 }}>
                      {isProcessing ? <><div className="loading-spinner" /> Processing...</> : <><i className="ti ti-wallet" /> Confirm & pay</>}
                    </button>
                    <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, background: '#fff', border: '1px solid #e8e8e6', borderRadius: 8, cursor: 'pointer' }}>Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFFFFF; }
        
        .app { display: flex; min-height: 100vh; }
        .sidebar { width: 210px; border-right: 1px solid #e8e8e6; background: #FFFFFF; }
        .logo { padding: 18px 20px; display: flex; align-items: center; gap: 9px; border-bottom: 1px solid #e8e8e6; cursor: pointer; }
        .logomark { width: 26px; height: 26px; background: #111; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #fff; }
        .nav { padding: 12px 0; }
        .nav-section { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #a0a09a; padding: 12px 20px 6px; }
        .ni { display: flex; align-items: center; gap: 9px; padding: 7px 20px; font-size: 12.5px; font-weight: 500; color: #6b6b66; cursor: pointer; border-left: 2px solid transparent; }
        .ni:hover, .ni.active { background: #f7f6f3; color: #111; }
        .ni.active { border-left-color: #111; font-weight: 600; }
        .sf { padding: 14px 20px; border-top: 1px solid #e8e8e6; display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .av { width: 28px; height: 28px; border-radius: 50%; background: #111; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
        
        .main { flex: 1; }
        .topbar { padding: 18px 28px; border-bottom: 1px solid #e8e8e6; display: flex; align-items: center; justify-content: space-between; }
        .page-h { font-size: 18px; font-weight: 700; color: #111; }
        .page-s { font-size: 12px; color: #a0a09a; margin-top: 2px; }
        .search-w { position: relative; }
        .search-w i { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #a0a09a; }
        .sinput { height: 34px; padding: 0 12px 0 32px; border: 1px solid #e8e8e6; border-radius: 8px; font-size: 12px; width: 190px; background: #fafaf9; }
        .btn-p { height: 34px; padding: 0 14px; background: #111; color: #fff; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        
        .statsbar { display: flex; border-bottom: 1px solid #e8e8e6; }
        .sc { flex: 1; padding: 14px 20px; border-right: 1px solid #e8e8e6; display: flex; align-items: center; gap: 12px; cursor: pointer; }
        .sc:hover { background: #fafaf9; }
        .sc-icon { width: 32px; height: 32px; border-radius: 8px; background: #f4f3f0; display: flex; align-items: center; justify-content: center; }
        .sc-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #a0a09a; }
        .sc-val { font-size: 16px; font-weight: 700; color: #111; }
        
        .tabs { display: flex; gap: 4px; padding: 16px 28px 0; border-bottom: 1px solid #e8e8e6; }
        .tab { padding: 10px 20px; font-size: 13px; font-weight: 600; color: #6b6b66; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { color: #111; border-bottom-color: #111; }
        
        .content-inner { padding: 24px 28px; }
        .card { background: #fff; border: 1px solid #e8e8e6; border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
        .card-header { padding: 14px 18px; border-bottom: 1px solid #f0efe9; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #111; display: flex; align-items: center; gap: 7px; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 9px 18px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #a0a09a; text-align: left; background: #fafaf9; }
        td { padding: 13px 18px; font-size: 12.5px; border-top: 1px solid #f4f3f0; cursor: pointer; }
        tr:hover td { background: #fafaf9; }
        .circ-av { width: 34px; height: 34px; border-radius: 8px; background: #f0efe9; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
        .flex-r { display: flex; align-items: center; gap: 10px; }
        .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 7px; border-radius: 99px; font-size: 10.5px; font-weight: 600; }
        .badge-ok { background: #f0f7f0; color: #2d6a2d; }
        .badge-blue { background: #f0f4fb; color: #2a4ea0; }
        .badge-warn { background: #fdf6ed; color: #8a5a0a; }
        .pb { width: 72px; height: 3px; background: #eeede8; border-radius: 99px; overflow: hidden; }
        .pbf { height: 100%; background: #111; }
        .contrib-btn { padding: 4px 12px; background: #111; color: #fff; border: none; border-radius: 6px; font-size: 11px; cursor: pointer; }
        .detail-card { padding: 24px; border: 1px solid #e8e8e6; border-radius: 12px; background: #fff; margin-top: 20px; }
        .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .close-btn { cursor: pointer; color: #999; font-size: 20px; }
      `}</style>

      <div className="app">
        <div className="sidebar">
          <div className="logo" onClick={() => { setActiveTab("circles"); setSelectedCircle(null); }}>
            <div className="logomark">R</div>
            <span className="logoname">Ruby</span>
          </div>
          <div className="nav">
            <div className="nav-section">Main</div>
            <a className={`ni ${activeTab === "circles" ? "active" : ""}`} onClick={() => { setActiveTab("circles"); setSelectedCircle(null); }}><i className="ti ti-users-group" /> My circles</a>
            <a className={`ni ${activeTab === "yield" ? "active" : ""}`} onClick={() => { setActiveTab("yield"); setSelectedCircle(null); }}><i className="ti ti-chart-line" /> Yield history</a>
            <a className={`ni ${activeTab === "activity" ? "active" : ""}`} onClick={() => { setActiveTab("activity"); setSelectedCircle(null); }}><i className="ti ti-activity" /> Activity</a>
          </div>
          <div className="sf">
            <div className="av">AK</div>
            <div><div style={{ fontSize: 12, fontWeight: 600 }}>Amara Kioni</div><div style={{ fontSize: 10, color: "#a0a09a" }}>Devnet · 6Xp7…3fKL</div></div>
          </div>
        </div>

        <div className="main">
          <div className="topbar">
            <div>
              <div className="page-h">
                {selectedCircle ? selectedCircle.name : activeTab === "circles" ? "My circles" : activeTab === "yield" ? "Yield history" : "Activity feed"}
              </div>
              <div className="page-s">
                {selectedCircle ? `Circle ID: ${selectedCircle.id} · ${selectedCircle.members} members` : 
                  activeTab === "circles" ? "Manage your autonomous savings circles" : 
                  activeTab === "yield" ? "Track yield generated across all circles" : 
                  "Recent transactions and updates"}
              </div>
            </div>
            <div className="hactions" style={{ display: "flex", gap: 8 }}>
              <div className="search-w">
                <i className="ti ti-search" />
                <input className="sinput" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button className="btn-p" onClick={handleCreateCircle}><i className="ti ti-plus" /> New circle</button>
            </div>
          </div>

          {!selectedCircle && (
            <div className="statsbar">
              <div className="sc"><div className="sc-icon"><i className="ti ti-building-bank" /></div><div><div className="sc-label">Total value</div><div className="sc-val">${totalValue.toLocaleString()}</div></div></div>
              <div className="sc"><div className="sc-icon"><i className="ti ti-trending-up" /></div><div><div className="sc-label">Total yield</div><div className="sc-val">+${totalYield.toFixed(2)}</div></div></div>
              <div className="sc"><div className="sc-icon"><i className="ti ti-percent" /></div><div><div className="sc-label">Avg APY</div><div className="sc-val">{avgApy}%</div></div></div>
              <div className="sc"><div className="sc-icon"><i className="ti ti-circles-relation" /></div><div><div className="sc-label">Active circles</div><div className="sc-val">{circles.length}</div></div></div>
            </div>
          )}

          <div className="content-inner">
            {selectedCircle ? (
              // Circle Detail View
              <div className="detail-card">
                <div className="detail-header">
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700 }}>{selectedCircle.name}</h2>
                    <p style={{ color: "#666", marginTop: 4 }}>ID: {selectedCircle.id} · {selectedCircle.members} members</p>
                  </div>
                  <div className="close-btn" onClick={() => setSelectedCircle(null)}>✕</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: "#fafaf9", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#999" }}>Balance</div><div style={{ fontSize: 24, fontWeight: 700 }}>{selectedCircle.balanceFormatted}</div></div>
                  <div style={{ padding: 16, background: "#fafaf9", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#999" }}>Yield earned</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2d6a2d" }}>{selectedCircle.yieldFormatted}</div></div>
                  <div style={{ padding: 16, background: "#fafaf9", borderRadius: 8 }}><div style={{ fontSize: 11, color: "#999" }}>APY / Protocol</div><div style={{ fontSize: 24, fontWeight: 700 }}>{selectedCircle.apy} · {selectedCircle.protocol}</div></div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Progress</h3>
                  <div className="pb" style={{ width: "100%", height: 8 }}><div className="pbf" style={{ width: `${selectedCircle.progress}%` }} /></div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>Cycle {selectedCircle.cycle} of {selectedCircle.total}</div>
                </div>
                <button className="contrib-btn" onClick={() => handleContribute(selectedCircle.id)} style={{ padding: "10px 20px", width: "auto" }}>Contribute now →</button>
              </div>
            ) : activeTab === "circles" ? (
              // Circles Table View
              <div className="card">
                <div className="card-header"><div className="card-title"><i className="ti ti-stack-2" /> Your circles</div></div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Circle</th><th>Balance</th><th>Yield</th><th>Progress</th><th>Protocol</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {filteredCircles.map(c => (
                        <tr key={c.id}>
                          <td onClick={() => setSelectedCircle(c)}><div className="flex-r"><div className="circ-av">{c.initials}</div><div><div className="cname" style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10, color: "#999" }}>{c.members} members</div></div></div></td>
                          <td onClick={() => setSelectedCircle(c)}><div style={{ fontWeight: 700 }}>{c.balanceFormatted}</div></td>
                          <td onClick={() => setSelectedCircle(c)}><div style={{ color: "#2d6a2d" }}>{c.yieldFormatted}</div></td>
                          <td onClick={() => setSelectedCircle(c)}><div><div className="pb"><div className="pbf" style={{ width: `${c.progress}%` }} /></div><div style={{ fontSize: 10, marginTop: 3 }}>{c.cycle}/{c.total}</div></div></td>
                          <td onClick={() => setSelectedCircle(c)}><div><div style={{ fontWeight: 600 }}>{c.protocol}</div><div style={{ fontSize: 10 }}>{c.apy}</div></div></td>
                          <td onClick={() => setSelectedCircle(c)}>{statusBadge(c.status)}</td>
                          <td><button className="contrib-btn" onClick={(e) => { e.stopPropagation(); handleContribute(c.id); }}>Contribute</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === "yield" ? (
              // Yield History View
              <div>
                <div className="card">
                  <div className="card-header"><div className="card-title"><i className="ti ti-chart-line" /> Yield accumulation</div></div>
                  <div className="card-content" style={{ padding: 24 }}>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: "#2d6a2d" }}>+${totalYield.toFixed(2)}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>Total yield earned across all circles</div>
                    </div>
                    <table style={{ width: "100%" }}>
                      <thead><tr><th>Week</th><th>Yield earned</th><th>Total value</th><th>Growth</th></tr></thead>
                      <tbody>
                        {yieldHistory.map((w, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{w.week}</td>
                            <td style={{ color: "#2d6a2d" }}>+${w.yield.toFixed(2)}</td>
                            <td>${w.total.toFixed(2)}</td>
                            <td><span style={{ color: "#2d6a2d" }}>↑ {((w.yield / (w.total - w.yield)) * 100).toFixed(1)}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><div className="card-title"><i className="ti ti-building-bank" /> Yield by protocol</div></div>
                  <div className="card-content" style={{ padding: 24 }}>
                    <div style={{ display: "grid", gap: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#fafaf9", borderRadius: 8 }}>
                        <span><strong>Kamino</strong> (2 circles)</span>
                        <span style={{ color: "#2d6a2d" }}>+$266.59</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: 12, background: "#fafaf9", borderRadius: 8 }}>
                        <span><strong>Jito</strong> (2 circles)</span>
                        <span style={{ color: "#2d6a2d" }}>+$46.29</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Activity View
              <div className="card">
                <div className="card-header"><div className="card-title"><i className="ti ti-activity" /> Recent activity</div></div>
                <div style={{ padding: 24 }}>
                  {recentActivity.map(activity => (
                    <div key={activity.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0efe9" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f4f3f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className={`ti ti-${activity.type === "deposit" ? "arrow-down" : activity.type === "yield" ? "trending-up" : activity.type === "vote" ? "vote" : "wallet"}`} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div>
                          {activity.type === "deposit" && <><strong>{activity.user}</strong> deposited <strong>${activity.amount} USDC</strong> to {activity.circle}</>}
                          {activity.type === "yield" && <>Agent earned <strong>+${activity.amount} USDC</strong> on {activity.circle} via {activity.protocol}</>}
                          {activity.type === "deploy" && <>Agent deployed <strong>${activity.amount.toLocaleString()} USDC</strong> to {activity.protocol} at {activity.apy}</>}
                          {activity.type === "vote" && <>Loan request from <strong>{activity.user}</strong> for ${activity.amount} · {activity.purpose}</>}
                          {activity.type === "contribution" && <><strong>{activity.user}</strong> contributed ${activity.amount} to {activity.circle}</>}
                        </div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{activity.time}</div>
                      </div>
                      {activity.txHash && <div style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>{activity.txHash}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}