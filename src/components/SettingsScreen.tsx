import { useState } from 'react';
import { RefreshCw, Mail, CheckCircle, AlertCircle, Clock, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { triggerPriceCheck, sendTestEmail, PriceCheckResult } from '../api';

function StatusIcon({ status }: { status: PriceCheckResult['status'] }) {
  if (status === 'price_drop') return <TrendingDown className="w-4 h-4 text-green-400" />;
  if (status === 'price_increase') return <TrendingUp className="w-4 h-4 text-red-400" />;
  if (status === 'no_change') return <Minus className="w-4 h-4 text-gray-500" />;
  return <Clock className="w-4 h-4 text-gray-500" />;
}

function StatusLabel({ status }: { status: PriceCheckResult['status'] }) {
  if (status === 'price_drop') return <span className="text-green-400 font-bold">Price Drop</span>;
  if (status === 'price_increase') return <span className="text-red-400 font-bold">Price Increase</span>;
  if (status === 'no_change') return <span className="text-gray-500">No Change</span>;
  return <span className="text-gray-500">Skipped</span>;
}

export function SettingsScreen() {
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<PriceCheckResult[] | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  async function handlePriceCheck() {
    setCheckLoading(true);
    setCheckResults(null);
    setCheckError(null);
    try {
      const results = await triggerPriceCheck();
      setCheckResults(results);
    } catch (err: any) {
      setCheckError(err.message);
    } finally {
      setCheckLoading(false);
    }
  }

  async function handleTestEmail() {
    setEmailLoading(true);
    setEmailResult(null);
    setEmailError(null);
    try {
      const msg = await sendTestEmail(emailInput.trim() || undefined);
      setEmailResult(msg);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-8">
      <div>
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary mb-1">Configuration</p>
        <h1 className="text-2xl font-black text-on-surface">Settings</h1>
      </div>

      {/* Price Check */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-sm font-black tracking-[0.15em] uppercase text-on-surface">Price Check</h2>
          <p className="text-xs text-gray-500 mt-1">Checks all tracked items for price changes. Runs automatically every 6 hours.</p>
        </div>

        <button
          onClick={handlePriceCheck}
          disabled={checkLoading}
          className="flex items-center gap-2 bg-primary text-[#131313] font-black text-xs tracking-[0.15em] uppercase px-5 py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${checkLoading ? 'animate-spin' : ''}`} />
          {checkLoading ? 'Checking Prices...' : 'Run Price Check Now'}
        </button>

        {checkError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400">{checkError}</p>
          </div>
        )}

        {checkResults !== null && (
          <div className="space-y-2">
            {checkResults.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tracked items to check.</p>
            ) : (
              checkResults.map((r, i) => (
                <div key={i} className="bg-surface-container p-4 border border-surface-container-high space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-on-surface truncate">{r.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusIcon status={r.status} />
                      <StatusLabel status={r.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Was <span className="text-on-surface font-bold">${r.oldPrice.toFixed(2)}</span></span>
                    {r.newPrice !== null && (
                      <span>Now <span className={`font-bold ${r.status === 'price_drop' ? 'text-green-400' : r.status === 'price_increase' ? 'text-red-400' : 'text-on-surface'}`}>${r.newPrice.toFixed(2)}</span></span>
                    )}
                    <span>Target <span className={`font-bold ${r.hitTarget ? 'text-green-400' : 'text-on-surface'}`}>${r.targetPrice.toFixed(2)}{r.hitTarget ? ' ✓' : ''}</span></span>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-gray-600">
                    {r.source && <span>Source: {r.source}</span>}
                    <span>Confidence: {r.confidence}</span>
                    {r.emailSent && <span className="text-green-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Alert sent</span>}
                    {r.emailError && <span className="text-red-400">Email failed: {r.emailError}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Test Email */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-4">
          <h2 className="text-sm font-black tracking-[0.15em] uppercase text-on-surface">Mailgun Test</h2>
          <p className="text-xs text-gray-500 mt-1">Sends a sample price-drop alert to verify your Mailgun credentials are working.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="email"
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            placeholder="Email address (or uses ALERT_EMAIL from .env)"
            className="flex-1 bg-surface-container border border-surface-container-high px-3 py-2 text-xs text-on-surface placeholder-gray-600 outline-none focus:border-primary"
          />
          <button
            onClick={handleTestEmail}
            disabled={emailLoading}
            className="flex items-center gap-2 bg-surface-container-high border border-surface-container-high text-on-surface font-black text-xs tracking-[0.15em] uppercase px-4 py-2 hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Mail className={`w-4 h-4 ${emailLoading ? 'animate-pulse' : ''}`} />
            {emailLoading ? 'Sending...' : 'Send Test'}
          </button>
        </div>

        {emailResult && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400">{emailResult}</p>
          </div>
        )}

        {emailError && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400">{emailError}</p>
          </div>
        )}
      </section>

      {/* Cron info */}
      <section className="space-y-3">
        <div className="border-l-4 border-surface-container-high pl-4">
          <h2 className="text-sm font-black tracking-[0.15em] uppercase text-on-surface">Schedule</h2>
          <p className="text-xs text-gray-500 mt-1">Change <code className="text-primary">PRICE_CHECK_CRON</code> in your <code className="text-primary">.env</code> file and restart the server.</p>
        </div>
        <div className="bg-surface-container border border-surface-container-high px-4 py-3 space-y-1.5 text-[11px] font-mono text-gray-500">
          <p><span className="text-primary">0 */6 * * *</span>  — every 6 hours (default)</p>
          <p><span className="text-primary">0 9 * * *</span>   — every day at 9am</p>
          <p><span className="text-primary">0 * * * *</span>   — every hour</p>
          <p><span className="text-primary">*/5 * * * *</span> — every 5 min (testing)</p>
        </div>
      </section>
    </div>
  );
}
