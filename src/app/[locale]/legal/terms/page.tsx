import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function TermsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = useTranslations('legal');
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-12">
      <h1>{t('terms_title')}</h1>
      <p className="text-fg-muted">
        本协议由律所定稿前为占位文本（D10 替换）。Credence 由 [Entity TBD]
        运营，仅向所在司法辖区允许参与预测市场的成年合格用户提供服务。
      </p>
      <h2>1. 服务说明</h2>
      <p>
        Credence 为基于 Polymarket 协议的本地化前端入口，本身不撮合订单、不托管资金。
        所有交易在 Polygon 链上由用户直接通过钱包签署执行。
      </p>
      <h2>2. 用户资格</h2>
      <p>
        年满 18 周岁；非美国、英国、新加坡等限制地区居民；具备独立判断与承担风险能力。
      </p>
      <h2>3. 风险</h2>
      <p>{t('risk_disclaimer')}</p>
    </article>
  );
}
