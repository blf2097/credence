'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { PredictionMarket, WorldModelNode } from '@/lib/core/market';
import {
  saveDynamicMarket,
  saveDynamicWorldModel,
  getDynamicMarkets,
  getDynamicWorldModels,
  deleteDynamicMarket,
  deleteDynamicWorldModel,
} from '@/lib/providers/credence-native/dynamic-catalog';
import { cn } from '@/lib/utils';

type Tab = 'event' | 'scalar' | 'world_model' | 'list';

export function AdminPanel() {
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>('event');
  const [dynamicMarkets, setDynamicMarkets] = useState<PredictionMarket[]>([]);
  const [dynamicModels, setDynamicModels] = useState<WorldModelNode[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setDynamicMarkets(getDynamicMarkets());
    setDynamicModels(getDynamicWorldModels());
  }, []);

  const refresh = () => {
    setDynamicMarkets(getDynamicMarkets());
    setDynamicModels(getDynamicWorldModels());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">管理后台</h1>
        <p className="mt-1 text-sm text-fg-muted">
          新增 Credence-native SKU 和世界模型。创建后立即出现在首页和市场中，无需重启。
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {([
          ['event', '事件型 SKU'],
          ['scalar', '变量型 SKU'],
          ['world_model', '世界模型'],
          ['list', '已创建'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setStatus(null); }}
            className={cn(
              'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {status ? (
        <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent">
          {status}
        </div>
      ) : null}

      {tab === 'event' ? (
        <EventSkuForm
          onSave={(market) => {
            saveDynamicMarket(market);
            refresh();
            setStatus(`事件型 SKU「${market.title}」已创建。刷新首页可见。`);
          }}
        />
      ) : null}

      {tab === 'scalar' ? (
        <ScalarSkuForm
          onSave={(market) => {
            saveDynamicMarket(market);
            refresh();
            setStatus(`变量型 SKU「${market.title}」已创建。刷新首页可见。`);
          }}
        />
      ) : null}

      {tab === 'world_model' ? (
        <WorldModelForm
          onSave={(model, market) => {
            saveDynamicWorldModel(model);
            if (market) saveDynamicMarket(market);
            refresh();
            setStatus(`世界模型「${model.title}」已创建。刷新首页可见。`);
          }}
        />
      ) : null}

      {tab === 'list' ? (
        <DynamicList
          markets={dynamicMarkets}
          models={dynamicModels}
          locale={locale}
          onDeleteMarket={(id) => {
            deleteDynamicMarket(id);
            refresh();
            setStatus('已删除。');
          }}
          onDeleteModel={(id) => {
            deleteDynamicWorldModel(id);
            refresh();
            setStatus('已删除。');
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event SKU form
// ---------------------------------------------------------------------------

function EventSkuForm({ onSave }: { onSave: (market: PredictionMarket) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [yesLabel, setYesLabel] = useState('Yes');
  const [noLabel, setNoLabel] = useState('No');
  const [endDate, setEndDate] = useState('');
  const [resolutionRule, setResolutionRule] = useState('');
  const [category, setCategory] = useState('macro');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    const slug = slugify(title);
    const id = `credence:${slug}`;
    const market: PredictionMarket = {
      id,
      provider: 'credence',
      kind: 'binary',
      settlementType: 'event',
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'macro',
      endDate: endDate || undefined,
      active: true,
      closed: false,
      outcomes: [
        { id: `${slug}:yes`, label: yesLabel || 'Yes', price: 0.5, sortOrder: 0 },
        { id: `${slug}:no`, label: noLabel || 'No', price: 0.5, sortOrder: 1 },
      ],
      metrics: { volume: 0, volume24hr: 0, liquidity: 0 },
      trading: { mode: 'signal_only', acceptingOrders: true, collateralSymbol: 'belief points' },
      source: { provider: 'credence', externalId: slug, slug },
      tags: ['event', 'admin-created'],
      metadata: {
        nativeType: 'event',
        resolutionRule: resolutionRule.trim() || '待定义',
        contentSource: 'admin-panel',
      },
    };
    onSave(market);
    setTitle(''); setDescription(''); setResolutionRule(''); setEndDate('');
  };

  return (
    <div className="space-y-4">
      <FormInput label="标题（问题）" value={title} onChange={setTitle} placeholder="例：7月1日美联储是否降息？" />
      <FormTextarea label="描述" value={description} onChange={setDescription} placeholder="SKU 规则说明、结算依据等" />
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Yes 标签" value={yesLabel} onChange={setYesLabel} />
        <FormInput label="No 标签" value={noLabel} onChange={setNoLabel} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="截止日期" value={endDate} onChange={setEndDate} type="date" />
        <FormSelect label="分类" value={category} onChange={setCategory} options={[
          ['macro', '宏观'], ['ai', 'AI'], ['crypto', '加密'], ['china-market', '中国'], ['world', '国际'],
        ]} />
      </div>
      <FormTextarea label="结算规则" value={resolutionRule} onChange={setResolutionRule} placeholder="如何判定结果？用什么数据源？" />
      <SubmitButton onClick={handleSubmit} disabled={!title.trim() || !description.trim()} label="创建事件型 SKU" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scalar SKU form
// ---------------------------------------------------------------------------

function ScalarSkuForm({ onSave }: { onSave: (market: PredictionMarket) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('%');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('100');
  const [currentEstimate, setCurrentEstimate] = useState('50');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    const slug = slugify(title);
    const id = `credence:${slug}`;
    const minNum = Number(min) || 0;
    const maxNum = Number(max) || 100;
    const estNum = Number(currentEstimate) || (minNum + maxNum) / 2;

    const market: PredictionMarket = {
      id,
      provider: 'credence',
      kind: 'scalar',
      settlementType: 'variable',
      title: title.trim(),
      description: description.trim(),
      category: 'ai',
      endDate: endDate || undefined,
      active: true,
      closed: false,
      outcomes: [
        { id: `${slug}:low`, label: `低于 ${(minNum + estNum) / 2}${unit}`, price: 0.25, sortOrder: 0 },
        { id: `${slug}:mid-low`, label: `${(minNum + estNum) / 2} - ${estNum}${unit}`, price: 0.25, sortOrder: 1 },
        { id: `${slug}:mid-high`, label: `${estNum} - ${(estNum + maxNum) / 2}${unit}`, price: 0.25, sortOrder: 2 },
        { id: `${slug}:high`, label: `高于 ${(estNum + maxNum) / 2}${unit}`, price: 0.25, sortOrder: 3 },
      ],
      metrics: { volume: 0, volume24hr: 0, liquidity: 0 },
      trading: { mode: 'signal_only', acceptingOrders: true, collateralSymbol: 'belief points' },
      source: { provider: 'credence', externalId: slug, slug },
      tags: ['scalar', 'admin-created'],
      metadata: {
        nativeType: 'scalar',
        unit: unit.trim() || '%',
        range: [minNum, maxNum],
        currentEstimate: estNum,
        contentSource: 'admin-panel',
      },
    };
    onSave(market);
    setTitle(''); setDescription(''); setCurrentEstimate('50');
  };

  return (
    <div className="space-y-4">
      <FormInput label="标题（问题）" value={title} onChange={setTitle} placeholder="例：2026年底 BTC 价格是多少？" />
      <FormTextarea label="描述" value={description} onChange={setDescription} placeholder="变量定义、测量方式、数据来源" />
      <div className="grid grid-cols-4 gap-3">
        <FormInput label="单位" value={unit} onChange={setUnit} />
        <FormInput label="最小值" value={min} onChange={setMin} type="number" />
        <FormInput label="最大值" value={max} onChange={setMax} type="number" />
        <FormInput label="当前估值" value={currentEstimate} onChange={setCurrentEstimate} type="number" />
      </div>
      <FormInput label="截止日期" value={endDate} onChange={setEndDate} type="date" />
      <SubmitButton onClick={handleSubmit} disabled={!title.trim() || !description.trim()} label="创建变量型 SKU" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// World model form
// ---------------------------------------------------------------------------

function WorldModelForm({
  onSave,
}: {
  onSave: (model: WorldModelNode, market: PredictionMarket | null) => void;
}) {
  const [title, setTitle] = useState('');
  const [thesis, setThesis] = useState('');
  const [confidence, setConfidence] = useState('60');
  const [horizon, setHorizon] = useState('2026-2028');
  const [assumptions, setAssumptions] = useState('');
  const [variables, setVariables] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !thesis.trim()) return;
    const slug = slugify(title);
    const modelId = `wm:${slug}`;
    const marketId = `credence:${slug}-world-model`;
    const conf = Number(confidence) / 100 || 0.6;

    const model: WorldModelNode = {
      id: modelId,
      title: title.trim(),
      thesis: thesis.trim(),
      confidence: conf,
      horizon: horizon.trim() || undefined,
      assumptions: assumptions.split('\n').map((s) => s.trim()).filter(Boolean),
      variables: variables.split('\n').map((s) => s.trim()).filter(Boolean),
      predictionMarketIds: [marketId],
      supportingEvidenceIds: [],
      opposingEvidenceIds: [],
      competingModelIds: [],
    };

    const market: PredictionMarket = {
      id: marketId,
      provider: 'credence',
      kind: 'world_model',
      settlementType: 'model_score',
      title: title.trim(),
      description: thesis.trim(),
      category: 'world',
      active: true,
      closed: false,
      outcomes: [
        { id: `${slug}:accelerate`, label: '加速', price: conf, sortOrder: 0 },
        { id: `${slug}:diverge`, label: '分化', price: 0.3, sortOrder: 1 },
        { id: `${slug}:blocked`, label: '受阻', price: 1 - conf - 0.3, sortOrder: 2 },
      ],
      metrics: { volume: 0, volume24hr: 0, liquidity: 0 },
      trading: { mode: 'signal_only', acceptingOrders: true, collateralSymbol: 'belief points' },
      source: { provider: 'credence', externalId: `${slug}-world-model`, slug: `${slug}-world-model` },
      tags: ['world_model', 'admin-created'],
      metadata: {
        nativeType: 'world_model',
        worldModelId: modelId,
        contentSource: 'admin-panel',
      },
    };

    onSave(model, market);
    setTitle(''); setThesis(''); setAssumptions(''); setVariables('');
  };

  return (
    <div className="space-y-4">
      <FormInput label="模型标题" value={title} onChange={setTitle} placeholder="例：AI agent 商业化发展模型" />
      <FormTextarea label="核心论点（Thesis）" value={thesis} onChange={setThesis} placeholder="一句话描述这个模型的核心判断" rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="初始置信度（%）" value={confidence} onChange={setConfidence} type="number" />
        <FormInput label="时间范围" value={horizon} onChange={setHorizon} />
      </div>
      <FormTextarea label="核心假设（每行一条）" value={assumptions} onChange={setAssumptions} placeholder="假设1&#10;假设2&#10;假设3" rows={4} />
      <FormTextarea label="追踪变量（每行一个）" value={variables} onChange={setVariables} placeholder="变量1&#10;变量2" rows={3} />
      <SubmitButton onClick={handleSubmit} disabled={!title.trim() || !thesis.trim()} label="创建世界模型" />
      <p className="text-xs text-fg-subtle">
        创建后会同时生成一个世界模型型 SKU 市场页面，并自动关联模型。
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic list
// ---------------------------------------------------------------------------

function DynamicList({
  markets,
  models,
  locale,
  onDeleteMarket,
  onDeleteModel,
}: {
  markets: PredictionMarket[];
  models: WorldModelNode[];
  locale: string;
  onDeleteMarket: (id: string) => void;
  onDeleteModel: (id: string) => void;
}) {
  if (markets.length === 0 && models.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-8 text-center text-sm text-fg-muted">
        还没有通过后台创建的 SKU 或世界模型。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {markets.length > 0 ? (
        <div>
          <h3 className="text-xs font-medium text-fg-subtle mb-2">动态 SKU（{markets.length}）</h3>
          <div className="space-y-2">
            {markets.map((market) => (
              <div key={market.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/${locale}/market/${market.source.externalId}`} className="text-sm font-medium hover:text-accent">
                    {market.title}
                  </Link>
                  <div className="mt-0.5 text-[10px] text-fg-subtle">
                    {market.kind} · {market.settlementType}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteMarket(market.id)}
                  className="text-xs text-fg-muted hover:text-accent-danger ml-2 shrink-0"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {models.length > 0 ? (
        <div>
          <h3 className="text-xs font-medium text-fg-subtle mb-2">动态世界模型（{models.length}）</h3>
          <div className="space-y-2">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{model.title}</div>
                  <div className="mt-0.5 text-[10px] text-fg-subtle">
                    confidence {(model.confidence * 100).toFixed(0)}% · {model.assumptions.length} assumptions · {model.variables.length} variables
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteModel(model.id)}
                  className="text-xs text-fg-muted hover:text-accent-danger ml-2 shrink-0"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared form components
// ---------------------------------------------------------------------------

function FormInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-fg-muted mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function FormTextarea({
  label, value, onChange, placeholder, rows = 3,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-fg-muted mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <div>
      <label className="block text-xs text-fg-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none"
      >
        {options.map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  );
}

function SubmitButton({
  onClick, disabled, label,
}: {
  onClick: () => void; disabled: boolean; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-40"
    >
      {label}
    </button>
  );
}

function slugify(text: string): string {
  const now = Date.now().toString(36).slice(-4);
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}-${now}`;
}
