'use client';

import { useRiskAcknowledgement } from '@/hooks/use-risk-acknowledgement';

export function RiskAcknowledgement() {
  const { acknowledged, ready, acknowledge } = useRiskAcknowledgement();

  if (!ready || acknowledged) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-bg-card p-6 shadow-2xl">
        <div className="text-xs font-mono text-accent-gold">RISK ACKNOWLEDGEMENT</div>
        <h2 className="mt-3 text-2xl font-semibold">Before you trade</h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-fg-muted">
          <p>
            Prediction markets are risky. You can lose 100% of the pUSD you put
            into a position. Prices are probabilities, not guarantees.
          </p>
          <p>
            You are responsible for confirming that this activity is legal in
            your jurisdiction. Credence is a non-custodial frontend and does not
            provide financial, legal, or tax advice.
          </p>
          <p>
            Do not trade with funds you cannot afford to lose. Do not use this
            service if you are in a restricted region.
          </p>
        </div>
        <button
          onClick={acknowledge}
          className="mt-6 w-full rounded-lg bg-fg px-4 py-3 font-medium text-bg hover:opacity-90"
        >
          I understand and accept the risks
        </button>
      </div>
    </div>
  );
}
