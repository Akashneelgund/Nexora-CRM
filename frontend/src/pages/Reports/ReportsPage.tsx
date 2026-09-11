import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  Send,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Clock,
  ShieldCheck,
  Award,
  TrendingUp,
  Package,
  MessageCircle,
  ExternalLink,
  PhoneCall
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [template, setTemplate] = useState<string>('');
  const [testPhone, setTestPhone] = useState<string>('+91 9986917364');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { showToast } = useNotifications();

  const fetchReport = () => {
    setLoading(true);
    api.getWhatsAppReport()
      .then(res => {
        if (res.success) {
          setReportData(res.summary);
          setTemplate(res.summary?.formattedMessage || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSendTest = async () => {
    setSending(true);
    try {
      const res = await api.sendTestWhatsAppReport(testPhone);
      if (res.success) {
        showToast(
          'WhatsApp Dispatched!',
          'Daily summary message delivered to ' + testPhone + ' (Message ID: ' + (res.result?.messageId || 'wamid-ok') + ')',
          'success'
        );
      }
    } catch (e: any) {
      showToast('Dispatch Error', e.message || 'Failed to send WhatsApp message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    if (template) {
      navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Copied to Clipboard', 'Formatted WhatsApp report copied', 'info');
    }
  };

  const getWhatsAppWebLink = () => {
    const cleanPhone = testPhone.replace(/[^0-9]/g, '');
    return 'https://api.whatsapp.com/send?phone=' + cleanPhone + '&text=' + encodeURIComponent(template);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Target Recipient: +91 9986917364</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp Daily Sales & Calling Digest</h1>
          <p className="text-xs text-slate-400 mt-0.5">Automated end-of-day sales, telecalling metrics, and inventory reports delivered to WhatsApp</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/[0.08] transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recalculate Summary</span>
          </button>
        </div>
      </div>

      {/* 1-Click WhatsApp Direct Instant Share Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#0C101A] to-emerald-950/60 border border-emerald-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-base font-bold text-white">Instant WhatsApp Send to +91 9986917364</h3>
          </div>
          <p className="text-xs text-slate-300">
            Click to launch WhatsApp Web or Mobile app with the complete daily summary pre-filled and ready to send!
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href={getWhatsAppWebLink()}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Open in WhatsApp & Send to 9986917364</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Grid: Left Editor & Right WhatsApp Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Customizer & Cloud API Dispatch (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Daily Report Message Template</h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold border border-white/[0.06] transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <textarea
              rows={16}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="w-full p-4 bg-black/40 border border-white/[0.08] rounded-2xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed shadow-inner"
            />

            {/* Target Phone & Cloud API Test Dispatch */}
            <div className="pt-2 border-t border-white/[0.08] space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Target Recipient WhatsApp Number
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="+91 9986917364"
                  className="flex-1 px-4 py-2.5 glass-input text-xs font-mono"
                />
                <button
                  onClick={handleSendTest}
                  disabled={sending}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-bold whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Sending...' : 'Dispatch Cloud API'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated cron schedule: <b className="text-white">Every Evening at 8:30 PM IST</b> to <b className="text-emerald-400">+91 9986917364</b>.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Realistic Smartphone WhatsApp Bubble Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-[3rem] p-3 bg-[#121726] border-4 border-white/[0.1] shadow-2xl space-y-3">
            {/* Phone Notch & Top Bar */}
            <div className="w-full bg-[#075E54] text-white rounded-t-[2.2rem] px-4 py-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  N
                </div>
                <div>
                  <div className="text-xs font-bold">NEXORA CRM Bot</div>
                  <div className="text-[9px] text-emerald-200">Verified Business Account</div>
                </div>
              </div>
              <div className="text-[10px] text-emerald-200 font-mono">8:30 PM</div>
            </div>

            {/* Chat Body (WhatsApp Green Background Wallpaper) */}
            <div className="bg-[#0b141a] p-3 rounded-b-[2.2rem] min-h-[440px] max-h-[500px] overflow-y-auto space-y-2 text-xs">
              <div className="text-center">
                <span className="px-2 py-0.5 rounded-md bg-[#182229] text-[9px] text-slate-400 shadow">
                  TODAY
                </span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tl-none shadow-md space-y-2 whitespace-pre-wrap font-sans text-[11px] leading-relaxed">
                {template}
                <div className="text-right text-[9px] text-emerald-200 flex items-center justify-end gap-1">
                  <span>8:30 PM</span>
                  <span>✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
