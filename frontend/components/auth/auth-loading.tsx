"use client";

export function AuthLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: "#fafaf9",
        color: "#6b6b66",
        fontSize: 13,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          border: "2px solid #e8e8e6",
          borderTopColor: "#111",
          borderRadius: "50%",
          animation: "ruby-spin 0.7s linear infinite",
        }}
      />
      <span>{label}</span>
      <style>{`@keyframes ruby-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
