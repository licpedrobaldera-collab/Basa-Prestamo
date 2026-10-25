import React, { useState } from 'react';
import { Loan, Client, SystemSettings } from '../types';
import { MessageSquare, Send, Sparkles, Loader2, X, Phone, Copy, Check } from 'lucide-react';

interface WhatsAppAssistantModalProps {
  loans: Loan[];
  clients: Client[];
  settings: SystemSettings;
  selectedLoanId?: string;
  onClose: () => void;
}

export const WhatsAppAssistantModal: React.FC<WhatsAppAssistantModalProps> = ({
  loans,
  clients,
  settings,
  selectedLoanId,
  onClose,
}) => {
  const [currentLoanId, setCurrentLoanId] = useState<string>(
    selectedLoanId || loans[0]?.id || ''
  );
  const [tone, setTone] = useState<string>('AMIGABLE_LEVE');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedLoan = loans.find((l) => l.id === currentLoanId);
  const selectedClient = clients.find((c) => c.id === selectedLoan?.clientId);

  const handleGenerate = async () => {
    if (!selectedLoan || !selectedClient) return;
    setIsLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/gemini/whatsapp-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient.name,
          quota: selectedLoan.quota,
          balance: selectedLoan.balance,
          daysOverdue: selectedLoan.daysOverdue || 0,
          tone,
          loanCode: selectedLoan.code,
          companyName: settings.companyName,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setGeneratedMessage(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppLink = () => {
    if (!selectedClient) return '#';
    const cleanPhone = (selectedClient.whatsapp || selectedClient.phone).replace(/\D/g, '');
    const prefix = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
    return `https://wa.me/${prefix}?text=${encodeURIComponent(generatedMessage)}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Cobrador Virtual Dominicano AI (WhatsApp)
              </h3>
              <p className="text-[11px] text-slate-400">
                Redacción persuasiva y cortés adaptada a días de mora y dialecto local.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Select loan */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Seleccionar Préstamo / Cliente:
            </label>
            <select
              value={currentLoanId}
              onChange={(e) => {
                setCurrentLoanId(e.target.value);
                setGeneratedMessage('');
              }}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            >
              {loans
                .filter((l) => l.status !== 'PAID')
                .map((l) => {
                  const c = clients.find((cli) => cli.id === l.clientId);
                  return (
                    <option key={l.id} value={l.id}>
                      {c?.name} — {l.code} (Atraso: {l.daysOverdue || 0} días)
                    </option>
                  );
                })}
            </select>
          </div>

          {/* Tone selection */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Tono de Cobranza Personalizado:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTone('PREVENTIVO_HOY')}
                className={`p-2 rounded-xl border text-left transition ${
                  tone === 'PREVENTIVO_HOY'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Recordatorio Preventivo</div>
                <div className="text-[10px] text-slate-500">Día de vencimiento</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('AMIGABLE_LEVE')}
                className={`p-2 rounded-xl border text-left transition ${
                  tone === 'AMIGABLE_LEVE'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Amigable pero Firme</div>
                <div className="text-[10px] text-slate-500">1 a 3 días de retraso</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('FIRME_MODERADO')}
                className={`p-2 rounded-xl border text-left transition ${
                  tone === 'FIRME_MODERADO'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Firme & Directo</div>
                <div className="text-[10px] text-slate-500">4 a 10 días de atraso</div>
              </button>

              <button
                type="button"
                onClick={() => setTone('PRE_LEGAL_SEVERO')}
                className={`p-2 rounded-xl border text-left transition ${
                  tone === 'PRE_LEGAL_SEVERO'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <div className="text-[11px] font-semibold">Pre-Jurídico Notarial</div>
                <div className="text-[10px] text-slate-500">11+ días (Último aviso)</div>
              </button>
            </div>
          </div>

          {/* Trigger AI Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Redactando mensaje dominicano con Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generar Mensaje con Inteligencia Artificial
              </>
            )}
          </button>

          {/* Generated Result Box */}
          {generatedMessage && (
            <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold text-emerald-400">
                  Mensaje listo para enviar:
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg text-slate-200 text-xs leading-relaxed font-sans whitespace-pre-wrap border border-slate-800">
                {generatedMessage}
              </div>

              <div className="pt-2">
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Send className="w-4 h-4" />
                  Abrir y Enviar por WhatsApp a {selectedClient?.name}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
