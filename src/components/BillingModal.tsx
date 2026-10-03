import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  X,
  RefreshCw,
  Building,
  Check,
  ChevronRight,
  Receipt
} from 'lucide-react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lawyerSicil?: string;
  lawyerName?: string;
  onSubscriptionUpdated?: () => void;
}

interface PlanInfo {
  tier: 'standart' | 'pro' | 'enterprise';
  name: string;
  monthlyPriceTry: number;
  yearlyPriceTry: number;
  monthlyTokens: number;
  description: string;
  features: string[];
  recommended?: boolean;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  lawyerSicil = '8109',
  lawyerName = 'Av. Osman Turgut',
  onSubscriptionUpdated
}) => {
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [tokenUsage, setTokenUsage] = useState<any>({ used: 0, limit: 50000, percentage: 0 });
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Checkout Form State
  const [selectedPlanTier, setSelectedPlanTier] = useState<'standart' | 'pro' | 'enterprise' | null>(null);
  const [cardHolder, setCardHolder] = useState<string>(lawyerName);
  const [cardNumber, setCardNumber] = useState<string>('5428 1930 4820 5821');
  const [expireMonth, setExpireMonth] = useState<string>('12');
  const [expireYear, setExpireYear] = useState<string>('28');
  const [cvc, setCvc] = useState<string>('432');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBillingData();
    } else {
      setSelectedPlanTier(null);
      setPaymentSuccessMsg(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const loadBillingData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch('/api/v1/billing/plans').then(r => r.json()),
        fetch('/api/v1/billing/subscription-status').then(r => r.json())
      ]);

      if (plansRes.plans) {
        setPlans(plansRes.plans);
      }
      if (subRes.success) {
        setSubscription(subRes.subscription);
        setTokenUsage(subRes.tokenUsage || { used: 0, limit: 50000, percentage: 0 });
        setInvoices(subRes.invoices || []);
      }
    } catch (err: any) {
      setErrorMessage('Abonelik verileri yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCheckout = (tier: 'standart' | 'pro' | 'enterprise') => {
    setSelectedPlanTier(tier);
    setPaymentSuccessMsg(null);
    setErrorMessage(null);
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanTier) return;

    setProcessingPayment(true);
    setErrorMessage(null);
    setPaymentSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTier: selectedPlanTier,
          billingCycle,
          cardHolder,
          cardNumber,
          expireMonth,
          expireYear,
          cvc,
          lawyerSicil
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Ödeme reddedildi.');
      }

      setPaymentSuccessMsg(data.message || 'Ödeme başarıyla onaylandı!');
      setSubscription(data.subscription);
      if (data.invoice) {
        setInvoices(prev => [data.invoice, ...prev]);
      }
      if (onSubscriptionUpdated) {
        onSubscriptionUpdated();
      }
      setTimeout(() => {
        setSelectedPlanTier(null);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ödeme tamamlanamadı.');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                Abonelik & AI Kota Yönetimi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  SaaS Faturalandırma
                </span>
              </h3>
              <p className="text-xs text-slate-400">Sicil #{lawyerSicil} — {lawyerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {paymentSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{paymentSuccessMsg}</span>
            </div>
          )}

          {/* Active Plan & Token Usage Card */}
          {subscription && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-950/90 to-slate-900 border border-indigo-900/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aktif Paketiniz</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    AKTİF
                  </span>
                </div>
                <h4 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {subscription.plan_name}
                  <span className="text-sm font-normal text-slate-400">
                    ({subscription.monthly_price_try?.toLocaleString('tr-TR')} ₺ / ay)
                  </span>
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Yenilenme Tarihi: {new Date(subscription.current_period_end).toLocaleDateString('tr-TR')}
                  {subscription.card_last4 && ` (Kart: **** ${subscription.card_last4})`}
                </p>
              </div>

              {/* Token Usage Bar */}
              <div className="w-full md:w-72 space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Aylık Token Kullanımı:</span>
                  <span className="font-mono font-semibold text-indigo-300">
                    {tokenUsage.used?.toLocaleString('tr-TR')} / {tokenUsage.limit?.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tokenUsage.percentage > 85 ? 'bg-rose-500' : tokenUsage.percentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${tokenUsage.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Doluluk Oranı: %{tokenUsage.percentage}</span>
                  <span className="text-emerald-400 font-medium">Kota Güvenli</span>
                </div>
              </div>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-xs font-medium ${billingCycle === 'monthly' ? 'text-slate-200' : 'text-slate-500'}`}>
              Aylık Ödeme
            </span>
            <button
              onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center transition relative border border-slate-700"
            >
              <div
                className={`w-4 h-4 rounded-full bg-indigo-500 shadow-md transition-transform duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-medium flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-slate-200' : 'text-slate-500'}`}>
              Yıllık Ödeme
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                2 Ay Ücretsiz
              </span>
            </span>
          </div>

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isCurrent = subscription?.plan_tier === p.tier;
              const price = billingCycle === 'yearly' ? Math.round(p.yearlyPriceTry / 12) : p.monthlyPriceTry;

              return (
                <div
                  key={p.tier}
                  className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                    p.recommended
                      ? 'bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-950 border-indigo-500/60 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-[10px] font-bold shadow-md">
                      EN ÇOK TERCİH EDİLEN
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-100">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>
                    </div>

                    <div className="py-2 border-y border-slate-800/80">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-slate-100">{price.toLocaleString('tr-TR')} ₺</span>
                        <span className="text-xs text-slate-400">/ ay</span>
                      </div>
                      <div className="text-[11px] text-indigo-400 font-mono mt-1">
                        {p.monthlyTokens.toLocaleString('tr-TR')} Token / Ay
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {p.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-slate-400 font-medium text-xs cursor-default border border-slate-700 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Mevcut Planınız
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartCheckout(p.tier)}
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md ${
                          p.recommended
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        <span>{p.tier === 'enterprise' ? 'Enterprise’a Geç' : 'Bu Plana Yükselt'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Checkout Drawer / Form (If Selected) */}
          {selectedPlanTier && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-700/60 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <h4 className="font-semibold text-sm text-slate-100">
                    3D Secure Güvenli Ödeme — {plans.find(p => p.tier === selectedPlanTier)?.name}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedPlanTier(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  İptal
                </button>
              </div>

              <form onSubmit={handleProcessCheckout} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs outline-none focus:border-indigo-500"
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Kart Numarası</label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono outline-none focus:border-indigo-500"
                      placeholder="**** **** **** ****"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Ay / Yıl</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={expireMonth}
                          onChange={(e) => setExpireMonth(e.target.value)}
                          className="w-1/2 px-2 py-2 text-center rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
                          placeholder="MM"
                        />
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={expireYear}
                          onChange={(e) => setExpireYear(e.target.value)}
                          className="w-1/2 px-2 py-2 text-center rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
                          placeholder="YY"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">CVC / Güvenlik Kodu</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        className="w-full px-3.5 py-2 text-center rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
                        placeholder="***"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={processingPayment}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition"
                    >
                      {processingPayment ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          3D Secure Doğrulanıyor...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Ödemeyi Tamamla ve Yükselt
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Invoice History Section */}
          <div className="space-y-3 pt-2">
            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" />
              Fatura ve Ödeme Geçmişi
            </h4>
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              {invoices.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">Kayıtlı fatura bulunmuyor.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Fatura No</th>
                      <th className="py-2.5 px-4">Paket</th>
                      <th className="py-2.5 px-4">Tarih</th>
                      <th className="py-2.5 px-4">Tutar (+KDV)</th>
                      <th className="py-2.5 px-4">Durum</th>
                      <th className="py-2.5 px-4 text-right">E-Fatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-200">{inv.invoice_no}</td>
                        <td className="py-2.5 px-4">{inv.plan_name}</td>
                        <td className="py-2.5 px-4 text-slate-400">{new Date(inv.invoice_date).toLocaleDateString('tr-TR')}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-100">{Number(inv.amount_try).toLocaleString('tr-TR')} ₺</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ÖDENDİ
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => alert(`Fatura No: ${inv.invoice_no}\nT.C. Maliye Uyumlu E-SMM Faturası hazırlanıyor.`)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 justify-end ml-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            İndir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            256-Bit SSL & Iyzico PCI-DSS Seviye 1 Güvenlik Standardı
          </span>
          <span className="text-slate-400">İptal ve iade garantisi</span>
        </div>
      </div>
    </div>
  );
};
