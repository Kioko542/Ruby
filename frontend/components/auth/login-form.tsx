// components/login-form.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess?: () => void;
}

type AuthStep = "capture" | "verify";

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<AuthStep>("capture");
  const [error, setError] = useState("");
  const { loginWithEmail, loginWithWallet, isLoading } = useAuthStore();
  const { toast } = useToast();

  const isEmail = contact.includes("@");
  const isPhone = /^[0-9+\- ]+$/.test(contact) && contact.trim().length > 6;

  const handleCapture = () => {
    if (!contact.trim()) {
      setError("Email or phone is required");
      return;
    }
    if (!isEmail && !isPhone) {
      setError("Enter a valid email or phone number");
      return;
    }
    setError("");
    setStep("verify");
    toast({
      title: "Code sent",
      description: "Check your email or phone for the 6-digit verification code.",
    });
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setError("");
    try {
      await loginWithEmail(contact);
      toast({
        title: "Welcome to Ruby",
        description: "Your wallet is ready on Devnet.",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWalletLogin = async () => {
    // API-READY: Replace with actual Phantom wallet adapter integration.
    const mockWalletAddress = "7xK5...pLq9";
    try {
      await loginWithWallet(mockWalletAddress);
      toast({
        title: "Phantom connected",
        description: "Your existing wallet is now linked.",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        .ruby-card {
          background: #fff;
          border: 1px solid #e8e8e6;
          border-radius: 12px;
          overflow: hidden;
          max-width: 440px;
          width: 100%;
          margin: 0 auto;
        }
        .ruby-card-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid #f0efe9;
        }
        .ruby-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }
        .ruby-card-description {
          font-size: 12px;
          color: #a0a09a;
          line-height: 1.5;
        }
        .ruby-card-content {
          padding: 24px;
        }
        .ruby-form-group {
          margin-bottom: 20px;
        }
        .ruby-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a0a09a;
          margin-bottom: 8px;
        }
        .ruby-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e8e8e6;
          border-radius: 8px;
          font-size: 13px;
          background: #fafaf9;
          color: #111;
          outline: none;
          transition: all 0.12s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .ruby-input:focus {
          border-color: #111;
          background: #fff;
        }
        .ruby-input.error {
          border-color: #dc2626;
          background: #fef2f2;
        }
        .ruby-error {
          font-size: 11px;
          color: #dc2626;
          margin-top: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ruby-btn {
          width: 100%;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.12s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .ruby-btn-primary {
          background: #111;
          color: #fff;
          border: none;
        }
        .ruby-btn-primary:hover:not(:disabled) {
          background: #333;
        }
        .ruby-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ruby-btn-outline {
          background: #fff;
          color: #666;
          border: 1px solid #e8e8e6;
        }
        .ruby-btn-outline:hover:not(:disabled) {
          background: #f7f6f3;
          border-color: #d4d4d0;
        }
        .ruby-btn-ghost {
          background: transparent;
          color: #a0a09a;
          border: none;
        }
        .ruby-btn-ghost:hover:not(:disabled) {
          background: #f7f6f3;
          color: #111;
        }
        .ruby-divider {
          position: relative;
          margin: 20px 0;
        }
        .ruby-divider-line {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
        }
        .ruby-divider-line span {
          width: 100%;
          border-top: 1px solid #e8e8e6;
        }
        .ruby-divider-text {
          position: relative;
          display: flex;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #a0a09a;
        }
        .ruby-divider-text span {
          background: #fff;
          padding: 0 12px;
        }
        .ruby-footnote {
          font-size: 10px;
          color: #a0a09a;
          text-align: center;
          margin-top: 16px;
          line-height: 1.4;
        }
        .loading-spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="ruby-card">
        <div className="ruby-card-header">
          <div className="ruby-card-title">Ruby onboarding</div>
          <div className="ruby-card-description">
            {step === "capture" 
              ? "Enter your email or phone to start saving together." 
              : "Enter the 6-digit code we sent you."}
          </div>
        </div>
        <div className="ruby-card-content">
          {step === "capture" ? (
            <div>
              <div className="ruby-form-group">
                <label className="ruby-label">Email or phone</label>
                <input
                  type="text"
                  placeholder="e.g., amara@ruby.so or +254 712 345 678"
                  className={`ruby-input ${error ? 'error' : ''}`}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isLoading}
                />
                {error && (
                  <div className="ruby-error">
                    <i className="ti ti-alert-circle" style={{ fontSize: 11 }} />
                    {error}
                  </div>
                )}
              </div>
              <button 
                className="ruby-btn ruby-btn-primary" 
                onClick={handleCapture} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Sending code...
                  </>
                ) : (
                  <>
                    <i className="ti ti-mail" style={{ fontSize: 13 }} />
                    Send verification code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="ruby-form-group">
                <label className="ruby-label">Verification code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className={`ruby-input ${error ? 'error' : ''}`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                />
                {error && (
                  <div className="ruby-error">
                    <i className="ti ti-alert-circle" style={{ fontSize: 11 }} />
                    {error}
                  </div>
                )}
              </div>
              <button 
                className="ruby-btn ruby-btn-primary" 
                onClick={handleVerify} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" style={{ fontSize: 13 }} />
                    Verify and continue
                  </>
                )}
              </button>
              <button 
                className="ruby-btn ruby-btn-ghost" 
                onClick={() => setStep("capture")}
                style={{ marginTop: 12 }}
              >
                <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
                Use a different email or phone
              </button>
            </div>
          )}

          <div className="ruby-divider">
            <div className="ruby-divider-line">
              <span />
            </div>
            <div className="ruby-divider-text">
              <span>Or</span>
            </div>
          </div>

          <button 
            className="ruby-btn ruby-btn-outline" 
            onClick={handleWalletLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner" />
                Connecting...
              </>
            ) : (
              <>
                <i className="ti ti-wallet" style={{ fontSize: 13 }} />
                Connect existing Phantom
              </>
            )}
          </button>

          <div className="ruby-footnote">
            <i className="ti ti-info-circle" style={{ fontSize: 10, marginRight: 4 }} />
            Devnet only for this hackathon. Your wallet is created silently and securely by Ruby.
          </div>
        </div>
      </div>
    </>
  );
}