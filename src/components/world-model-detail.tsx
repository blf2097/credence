import Link from 'next/link';
import type { EvidenceNode } from '@/lib/core/market';
import type { WorldModelBundle } from '@/lib/providers/credence-native/world-models';
import { cn } from '@/lib/utils';

export function WorldModelDetail({
  bundle,
  locale,
}: {
  bundle: WorldModelBundle;
  locale: string;
}) {
  const { model, supportingEvidence, opposingEvidence, linkedMarkets } = bundle;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-bg-card p-4">
        <div className="text-[10px] tracking-wider text-fg-subtle mb-1">
          WORLD MODEL
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{model.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {model.thesis}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-right shrink-0">
            <div className="text-[10px] text-fg-subtle">Confidence</div>
            <div className="text-2xl font-semibold text-accent">
              {(model.confidence * 100).toFixed(1)}%
            </div>
            {model.horizon ? (
              <div className="text-[10px] text-fg-subtle">{model.horizon}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Core assumptions">
          <List items={model.assumptions} />
        </Panel>
        <Panel title="Tracked variables">
          <List items={model.variables} />
        </Panel>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EvidencePanel title="Supporting evidence" tone="support" evidence={supportingEvidence} />
        <EvidencePanel title="Opposing evidence" tone="oppose" evidence={opposingEvidence} />
      </section>

      <section className="rounded-xl border border-border bg-bg-card p-4">
        <h3 className="text-sm font-medium">Linked prediction nodes</h3>
        <div className="mt-3 space-y-2">
          {linkedMarkets.map((market) => (
            <Link
              key={market.id}
              href={`/${locale}/market/${market.source.externalId}`}
              className="block rounded-lg border border-border bg-bg-elevated p-3 hover:border-border-strong"
            >
              <div className="text-sm font-medium">{market.title}</div>
              <div className="mt-1 text-xs text-fg-subtle">
                {market.kind} · {market.settlementType} · {market.trading.mode}
              </div>
            </Link>
          ))}
          {!linkedMarkets.length ? (
            <div className="text-sm text-fg-muted">No linked prediction nodes yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-fg-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function EvidencePanel({
  title,
  evidence,
  tone,
}: {
  title: string;
  evidence: EvidenceNode[];
  tone: 'support' | 'oppose';
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 space-y-3">
        {evidence.map((item) => (
          <EvidenceCard key={item.id} item={item} tone={tone} />
        ))}
        {!evidence.length ? (
          <div className="text-sm text-fg-muted">No evidence yet.</div>
        ) : null}
      </div>
    </div>
  );
}

function EvidenceCard({
  item,
  tone,
}: {
  item: EvidenceNode;
  tone: 'support' | 'oppose';
}) {
  const update = item.bayesUpdate;
  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{item.title}</div>
          <div className="mt-1 text-xs leading-relaxed text-fg-muted">
            {item.summary}
          </div>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-1 text-[10px] uppercase shrink-0',
            tone === 'support'
              ? 'bg-accent/10 text-accent'
              : 'bg-accent-danger/10 text-accent-danger',
          )}
        >
          {tone}
        </span>
      </div>
      {update ? (
        <div className="mt-3 rounded-md border border-border bg-bg-card p-2 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span>Prior {(update.prior * 100).toFixed(1)}%</span>
            <span>→</span>
            <span>Posterior {(update.posterior * 100).toFixed(1)}%</span>
          </div>
          <div className="mt-2 text-fg-muted leading-relaxed">
            {update.rationale}
          </div>
        </div>
      ) : null}
      <div className="mt-2 text-[10px] text-fg-subtle">
        Observed {new Date(item.observedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
