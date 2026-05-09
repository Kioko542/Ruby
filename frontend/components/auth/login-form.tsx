// components/login-form.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useToast } from "@/hooks/use-toast";
import { PrivyLogin } from "@/components/auth/privy-login";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [error, setError] = useState("");
  const { loginWithWallet, isLoading } = useAuthStore();
  const { toast } = useToast();
  const hasPrivy = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  const handleWalletLogin = async () => {
    setError("");
    try {
      await loginWithWallet();
      toast({
        title: "Wallet connected",
        description: "Your session was verified by the Ruby backend.",
      });
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      setError(message);
      toast({
        title: "Connection failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handlePrivyError = (message: string) => {
    setError(message);
    toast({
      title: "Verification failed",
      description: message,
      variant: "destructive",
    });
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
            Sign in with Privy email or verify a Solana wallet through the Ruby backend.
          </div>
        </div>
        <div className="ruby-card-content">
          {hasPrivy ? (
            <PrivyLogin onSuccess={onSuccess} onError={handlePrivyError} />
          ) : (
            <div className="ruby-footnote" style={{ marginTop: 0, marginBottom: 12 }}>
              Set NEXT_PUBLIC_PRIVY_APP_ID to enable Privy email login.
            </div>
          )}

          {error && (
            <div className="ruby-error" style={{ marginTop: 12 }}>
              <i className="ti ti-alert-circle" style={{ fontSize: 11 }} />
              {error}
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