import type { EvidenceNode, PredictionMarket, WorldModelNode } from '@/lib/core/market';

const now = new Date().toISOString();

export const credenceNativeMarkets: PredictionMarket[] = [
  {
    id: 'credence:cn-a-share-shanghai-2026-06-08-drop-4pct',
    provider: 'credence',
    kind: 'binary',
    settlementType: 'event',
    title: '6 月 8 号中国上证 A 股是否会跌 4% 以上？',
    description:
      '事件型 SKU。标的为中国上证指数在 2026 年 6 月 8 日常规交易日收盘表现。若当日收盘跌幅大于或等于 4.00%，则 Yes；否则 No。该 SKU 当前用于 Credence-native 模拟预测，不触发真实资金交易。',
    category: 'macro',
    endDate: '2026-06-08T15:00:00+08:00',
    active: true,
    closed: false,
    outcomes: [
      {
        id: 'cn-a-share-shanghai-2026-06-08-drop-4pct:yes',
        label: 'Yes',
        price: 0.18,
        sortOrder: 0,
      },
      {
        id: 'cn-a-share-shanghai-2026-06-08-drop-4pct:no',
        label: 'No',
        price: 0.82,
        sortOrder: 1,
      },
    ],
    metrics: {
      volume: 0,
      volume24hr: 0,
      liquidity: 0,
    },
    trading: {
      mode: 'signal_only',
      acceptingOrders: true,
      collateralSymbol: 'belief points',
    },
    source: {
      provider: 'credence',
      externalId: 'cn-a-share-shanghai-2026-06-08-drop-4pct',
      slug: 'cn-a-share-shanghai-2026-06-08-drop-4pct',
    },
    tags: ['event', 'a-share', 'macro', 'china-market'],
    metadata: {
      nativeType: 'event',
      resolutionRule:
        'Use official China Shanghai Composite close on 2026-06-08. Yes if close-to-close daily return <= -4.00%.',
      createdAt: now,
    },
  },
  {
    id: 'credence:ai-coding-agent-github-issue-success-rate-2026',
    provider: 'credence',
    kind: 'scalar',
    settlementType: 'variable',
    title: '2026 年底 AI coding agent 在真实 GitHub issue 上成功率是多少？',
    description:
      '变量型 SKU。预测到 2026 年底，AI coding agent 在真实 GitHub issue 中独立完成任务并被维护者接受的比例。当前以区间分布提交信念，用于测试连续变量预测流程。',
    category: 'ai',
    endDate: '2026-12-31T23:59:59Z',
    active: true,
    closed: false,
    outcomes: [
      { id: 'ai-coding-agent-success-rate-2026:p10', label: '<10%', price: 0.08, sortOrder: 0 },
      { id: 'ai-coding-agent-success-rate-2026:p10-25', label: '10-25%', price: 0.27, sortOrder: 1 },
      { id: 'ai-coding-agent-success-rate-2026:p25-50', label: '25-50%', price: 0.42, sortOrder: 2 },
      { id: 'ai-coding-agent-success-rate-2026:p50-plus', label: '>50%', price: 0.23, sortOrder: 3 },
    ],
    metrics: {
      volume: 0,
      volume24hr: 0,
      liquidity: 0,
    },
    trading: {
      mode: 'signal_only',
      acceptingOrders: true,
      collateralSymbol: 'belief points',
    },
    source: {
      provider: 'credence',
      externalId: 'ai-coding-agent-github-issue-success-rate-2026',
      slug: 'ai-coding-agent-github-issue-success-rate-2026',
    },
    tags: ['variable', 'ai-agent', 'software-engineering', 'github'],
    metadata: {
      nativeType: 'variable',
      unit: '%',
      range: [0, 100],
      currentEstimate: 31,
      resolutionRule:
        'Resolve using a predefined benchmark of real GitHub issues and accepted autonomous agent patches by 2026-12-31.',
      createdAt: now,
    },
  },
  {
    id: 'credence:china-enterprise-globalization-world-model',
    provider: 'credence',
    kind: 'world_model',
    settlementType: 'model_score',
    title: '中国企业出海业务发展模型',
    description:
      '世界模型型 SKU。用于跟踪中国企业在跨境电商、制造业品牌化、SaaS、AI 应用、供应链服务等方向的出海路径。该模型下可挂接事件预测、连续变量、证据节点和行动建议。当前为 signal-only 模拟版本。',
    category: 'world-model',
    active: true,
    closed: false,
    outcomes: [
      { id: 'china-enterprise-globalization:accelerates', label: '加速出海', price: 0.46, sortOrder: 0 },
      { id: 'china-enterprise-globalization:fragmented', label: '结构分化', price: 0.39, sortOrder: 1 },
      { id: 'china-enterprise-globalization:blocked', label: '外部受阻', price: 0.15, sortOrder: 2 },
    ],
    metrics: {
      volume: 0,
      volume24hr: 0,
      liquidity: 0,
    },
    trading: {
      mode: 'signal_only',
      acceptingOrders: true,
      collateralSymbol: 'belief points',
    },
    source: {
      provider: 'credence',
      externalId: 'china-enterprise-globalization-world-model',
      slug: 'china-enterprise-globalization-world-model',
    },
    tags: ['world-model', 'china-business', 'globalization', 'strategy'],
    metadata: {
      nativeType: 'world_model',
      worldModelId: 'wm:china-enterprise-globalization',
      createdAt: now,
    },
  },
];

export const credenceWorldModels: WorldModelNode[] = [
  {
    id: 'wm:china-enterprise-globalization',
    title: '中国企业出海业务发展模型',
    thesis:
      '中国企业出海不是单一趋势，而是供应链能力、品牌能力、合规能力、AI 工具化和本地化运营能力共同作用的分化过程。',
    confidence: 0.62,
    horizon: '2026-2028',
    assumptions: [
      '国内需求增速放缓会继续推动企业寻找海外增量。',
      '海外监管、贸易壁垒和本地化能力会显著分化企业表现。',
      'AI 工具会降低内容、客服、运营和销售本地化成本。',
    ],
    variables: [
      '海外收入占比',
      '本地化团队密度',
      '合规处罚频次',
      'AI 工具渗透率',
      '品牌溢价能力',
    ],
    predictionMarketIds: [
      'credence:china-enterprise-globalization-world-model',
    ],
    supportingEvidenceIds: ['ev:cross-border-ecommerce-growth', 'ev:ai-localization-cost-drop'],
    opposingEvidenceIds: ['ev:trade-barrier-tightening'],
    competingModelIds: [],
  },
];

export const credenceEvidence: EvidenceNode[] = [
  {
    id: 'ev:cross-border-ecommerce-growth',
    title: '跨境电商平台和供应链服务企业继续扩张',
    observedAt: now,
    summary:
      '跨境电商、物流和海外仓基础设施继续完善，支持中小企业低成本试错海外市场。',
    supportsModelIds: ['wm:china-enterprise-globalization'],
    opposesModelIds: [],
    affectedVariableIds: ['海外收入占比', '本地化团队密度'],
    bayesUpdate: {
      prior: 0.58,
      posterior: 0.62,
      rationale: '基础设施改善提高出海成功率，但不直接解决品牌和合规问题。',
    },
  },
  {
    id: 'ev:trade-barrier-tightening',
    title: '主要目的地市场贸易与数据合规要求趋严',
    observedAt: now,
    summary:
      '海外市场对供应链来源、数据合规、消费者保护和平台责任提出更高要求。',
    supportsModelIds: [],
    opposesModelIds: ['wm:china-enterprise-globalization'],
    affectedVariableIds: ['合规处罚频次', '品牌溢价能力'],
    bayesUpdate: {
      prior: 0.66,
      posterior: 0.62,
      rationale: '监管摩擦降低低质量出海企业成功率，强化结构分化判断。',
    },
  },
  {
    id: 'ev:ai-localization-cost-drop',
    title: 'AI 降低海外内容、客服与销售本地化成本',
    observedAt: now,
    summary:
      'LLM 和 agent 工具降低跨语言内容生产、客服响应、广告素材和销售线索处理成本。',
    supportsModelIds: ['wm:china-enterprise-globalization'],
    opposesModelIds: [],
    affectedVariableIds: ['AI 工具渗透率', '本地化团队密度'],
    bayesUpdate: {
      prior: 0.60,
      posterior: 0.62,
      rationale: 'AI 工具改善本地化效率，但短期仍受组织能力限制。',
    },
  },
];
