import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function RiskPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('legal');
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-12">
      <h1>{t('risk_title')}</h1>
      <p className="text-fg-muted">{t('risk_disclaimer')}</p>
      <ul>
        <li>预测市场结果不可逆；下单前请确认问题、解析来源与截止时间。</li>
        <li>USDC.e 与 ETH gas 价格波动可能影响实际成交成本。</li>
        <li>极端事件下流动性可能枯竭，无法及时平仓。</li>
        <li>Credence 不对 Polymarket 协议本身的智能合约风险负责。</li>
      </ul>
    </article>
  );
}
