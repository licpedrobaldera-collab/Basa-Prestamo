import React, { useState } from 'react';
import { Loan, Client, PaymentTransaction, ExtraCharge } from '../../types';
import { formatDOP } from '../../utils/loanCalculator';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Brain,
  Sparkles,
  PieChart,
  BarChart3,
  DollarSign,
  Scale,
  Award,
  Users,
  Clock,
  Printer,
  ChevronRight,
  Send,
  Zap,
} from 'lucide-react';

interface ManagerPortalProps {
  managerName: string;
  loans: Loan[];
  clients: Client[];
  payments: PaymentTransaction[];
  extraCharges: ExtraCharge[];
  onApproveLoan: (loanId: string, managerNotes?: string) => void;
  onRejectLoan: (loanId: string, reason: string) => void;
  onWaiveExtraCharge: (chargeId: string, justification: string) => void;
  onApplyDiscount: (loanId: string, discountAmount: number, justification: string) => void;
}

export const ManagerPortal: React.FC<ManagerPortalProps> = ({
  managerName,
  loans,
  clients,
  payments,
  extraCharges,
  onApproveLoan,
  onRejectLoan,
  onWaiveExtraCharge,
  onApplyDiscount,
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'monitoring' | 'exceptions' | 'reports'>('approvals');

  // AI Scoring state
  const [evaluatingLoanId, setEvaluatingLoanId] = useState<string | null>(null);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<Record<string, any>>({});
  const [aiLoading, setAiLoading] = useState(false);

  // Rejection modal
  const [rejectingLoan, setRejectingLoan] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Discount modal
  const [discountingLoan, setDiscountingLoan] = useState<Loan | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');

  // Waive charge modal
  const [waivingCharge, setWaivingCharge] = useState<ExtraCharge | null>(null);
  const [waiveReason, setWaiveReason] = useState('');

  // Pending approval loans
  const pendingApprovals = loans.filter((l) => l.status === 'EN_TRAMITE');
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE');

  // Portfolio KPIs
  const totalPortfolio = loans.reduce((s, l) => s + l.balance, 0);
  const totalDisbursed = loans.reduce((s, l) => s + l.amount, 0);
  const totalCollectedMonth = payments.reduce((s, p) => s + p.amount, 0);
  const overdueBalance = overdueLoans.reduce((s, l) => s + l.balance, 0);
  const overdueRate = totalPortfolio > 0 ? ((overdueBalance / totalPortfolio) * 100).toFixed(1) : '0.0';

  // Run Gemini AI credit scoring for a loan
  const handleRunAiEvaluation = async (loan: Loan) => {
    setEvaluatingLoanId(loan.id);
    setAiLoading(true);
    const client = clients.find((c) => c.id === loan.clientId) || {
      name: 'Cliente Evaluado',
      cedula: '001-0000000-0',
      occupation: 'Comerciante Independiente',
      monthlyIncome: 35000,
      address: 'Santo Domingo',
    };

    try {
      const res = await fetch('/api/gemini/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client,
          loanDetails: {
            amount: loan.amount,
            frequency: loan.frequency,
            terms: loan.terms,
            rate: loan.rate,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiAnalysisResults((prev) => ({ ...prev, [loan.id]: data.data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingLoan || !rejectReason.trim()) return;
    onRejectLoan(rejectingLoan.id, rejectReason.trim());
    setRejectingLoan(null);
    setRejectReason('');
  };

  const handleConfirmDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(discountAmount);
    if (!discountingLoan || !amt || amt <= 0 || !discountReason.trim()) return;
    onApplyDiscount(discountingLoan.id, amt, discountReason.trim());
    setDiscountingLoan(null);
    setDiscountAmount('');
    setDiscountReason('');
  };

  const handleConfirmWaive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waivingCharge || !waiveReason.trim()) return;
    onWaiveExtraCharge(waivingCharge.id, waiveReason.trim());
    setWaivingCharge(null);
    setWaiveReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Panel de Gerente Operativo & Supervisión de Riesgos
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                Gerente: {managerName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Centro de Decisiones, Autorizaciones & KPIs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Aprobación y desembolso de créditos, análisis asistido con Gemini AI, condonación de mora y reportes gerenciales.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('approvals')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Bandeja de Aprobación ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-amber-500/30 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Condonaciones
            </button>
          </div>
        </div>

        {/* 4 Executive KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Cartera Total Activa</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-1">
              {formatDOP(totalPortfolio)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{activeLoans.length} préstamos vigentes</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Índice de Mora (%)</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 ${parseFloat(overdueRate) > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overdueRate}%
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{formatDOP(overdueBalance)} en atraso</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Recaudado este Período</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {formatDOP(totalCollectedMonth)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{payments.length} transacciones aplicadas</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Solicitudes por Decidir</span>
            <span className="text-xl sm:text-2xl font-black text-sky-400 block mt-1">
              {pendingApprovals.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Esperando dictamen gerencial</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Aprobación de Créditos ({pendingApprovals.length})
        </button>

        <button
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Monitoreo de Cartera & Mora
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'exceptions'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          Excepciones & Condonaciones
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Reportes Gerenciales & Rendimiento
        </button>
      </div>

      {/* TAB: BANDEJA DE APROBACIÓN DE CRÉDITOS */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Solicitudes Pendientes de Aprobación Gerencial ({pendingApprovals.length})
            </h3>
            <span className="text-xs text-slate-400">
              Evaluación asistida por Inteligencia Artificial Gemini Scoring
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-200 font-bold">¡No hay solicitudes pendientes en la bandeja gerencial!</p>
              <p className="text-xs text-slate-500 mt-1">Los auxiliares de préstamos no tienen expedientes pendientes de dictamen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((loan) => {
                const client = clients.find((c) => c.id === loan.clientId);
                const aiResult = aiAnalysisResults[loan.id];

                return (
                  <div
                    key={loan.id}
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-5 shadow-2xl"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {loan.code}
                          </span>
                          <span className="text-xs text-slate-400">Remitido por: {loan.advisorName || 'Auxiliar'}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mt-1">{client?.name || 'Cliente'}</h4>
                        <p className="text-xs text-slate-400">
                          Cédula: <span className="font-mono text-slate-300">{client?.cedula}</span> • Ingresos: {formatDOP(client?.monthlyIncome || 0)}/mes • {client?.occupation}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRunAiEvaluation(loan)}
                          disabled={aiLoading && evaluatingLoanId === loan.id}
                          className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                        >
                          <Brain className="w-4 h-4 text-purple-200" />
                          {aiLoading && evaluatingLoanId === loan.id ? 'Evaluando...' : 'Evaluar con Gemini AI'}
                        </button>
                      </div>
                    </div>

                    {/* Financial Specs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Monto a Desembolsar:</span>
                        <span className="text-base font-black text-white">{formatDOP(loan.amount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Cuota Sugerida:</span>
                        <span className="text-base font-black text-emerald-400">{formatDOP(loan.quota)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Modalidad & Plazo:</span>
                        <span className="font-bold text-slate-200">{loan.frequency} • {loan.terms} cuotas</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Tasa Mensual:</span>
                        <span className="font-bold text-amber-400">{loan.rate}% mensual</span>
                      </div>
                    </div>

                    {/* AI Scoring Box if evaluated */}
                    {aiResult && (
                      <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-purple-300 flex items-center gap-1.5 text-sm">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Score Crediticio Popular: {aiResult.score}/100 (Riesgo: {aiResult.nivelRiesgo})
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            aiResult.dictamen === 'APROBADO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            Dictamen IA: {aiResult.dictamen}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{aiResult.analisis}</p>
                        {aiResult.recomendacionesCobrador && (
                          <p className="text-purple-300 text-[11px] font-semibold">
                            💡 Consejo para Cobranza: {aiResult.recomendacionesCobrador}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Decision Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => onApproveLoan(loan.id, `Aprobado por Gerente ${managerName}`)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar y Autorizar Desembolso Inmediato
                      </button>

                      <button
                        onClick={() => setRejectingLoan(loan)}
                        className="px-5 py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MONITOREO DE CARTERA & MORA */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Cartera al Día (Sin Mora)</span>
              <span className="text-2xl font-black text-emerald-400 block">
                {formatDOP(activeLoans.reduce((s, l) => s + l.balance, 0))}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {activeLoans.length} clientes con cumplimiento puntual
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Cartera en Atraso (Vencida)</span>
              <span className="text-2xl font-black text-rose-400 block">
                {formatDOP(overdueBalance)}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {overdueLoans.length} préstamos en gestión de cobro
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Proyección de Recaudo (Próximos 7 días)</span>
              <span className="text-2xl font-black text-sky-400 block">
                {formatDOP(activeLoans.reduce((s, l) => s + l.quota, 0) * 0.85)}
              </span>
              <span className="text-[11px] text-slate-500 block">Estimación con tasa de efectividad del 85%</span>
            </div>
          </div>

          {/* Overdue Loans Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h4 className="text-xs font-bold text-white uppercase">
                Listado de Préstamos en Mora para Acción Gerencial ({overdueLoans.length})
              </h4>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Informe de Mora
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Cuota Vencida</th>
                    <th className="p-3">Balance Restante</th>
                    <th className="p-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {overdueLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        ¡Excelente noticia! No hay préstamos en mora actualmente.
                      </td>
                    </tr>
                  ) : (
                    overdueLoans.map((l) => {
                      const client = clients.find((c) => c.id === l.clientId);
                      return (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-rose-400">{l.code}</td>
                          <td className="p-3 font-bold text-white">{client?.name}</td>
                          <td className="p-3 text-slate-300 font-mono">{client?.phone}</td>
                          <td className="p-3 font-bold text-rose-300">{formatDOP(l.quota)}</td>
                          <td className="p-3 font-black text-amber-400">{formatDOP(l.balance)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setDiscountingLoan(l)}
                              className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-bold border border-amber-500/30"
                            >
                              Aplicar Descuento / Arreglo
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXCEPCIONES & CONDONACIONES */}
      {activeTab === 'exceptions' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Scale className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-base font-black text-white">Módulo de Excepciones y Condonaciones de Mora</h4>
                <p className="text-xs text-slate-400">
                  Autorización de exoneración de penalidades, cargos por mora y descuentos por pronto pago.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">
                Cargos Extras y Moras Activas ({extraCharges.filter((c) => c.status === 'PENDIENTE').length})
              </span>
              <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden">
                {extraCharges.filter((c) => c.status === 'PENDIENTE').length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No existen cargos de mora o gastos administrativos pendientes de exoneración.
                  </div>
                ) : (
                  extraCharges
                    .filter((c) => c.status === 'PENDIENTE')
                    .map((c) => {
                      const l = loans.find((item) => item.id === c.loanId);
                      return (
                        <div key={c.id} className="p-4 bg-slate-950 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white">{c.description}</span>
                            <span className="text-[11px] text-slate-400 block">
                              Préstamo: <strong className="text-amber-400">{l?.code || c.loanId}</strong> • Tipo: {c.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-rose-400 text-sm">{formatDOP(c.amount)}</span>
                            <button
                              onClick={() => setWaivingCharge(c)}
                              className="px-3 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 rounded-xl text-xs font-bold border border-rose-500/30 cursor-pointer"
                            >
                              Exonerar Cargo
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REPORTES GERENCIALES */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-black text-white">Informe Ejecutivo de Rendimiento Gerencial</h4>
                <p className="text-xs text-slate-400">Consolidado financiero para toma de decisiones</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Colocado</span>
                <span className="text-xl font-black text-white mt-1 block">{formatDOP(totalDisbursed)}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Intereses Cobrados</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">
                  {formatDOP(payments.reduce((s, p) => s + p.interestPaid, 0))}
                </span>
              </div>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Capital Recuperado</span>
                <span className="text-xl font-black text-sky-400 mt-1 block">
                  {formatDOP(payments.reduce((s, p) => s + p.capitalPaid, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZAR PRÉSTAMO CON JUSTIFICACIÓN */}
      {rejectingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">Rechazo de Solicitud de Crédito</h3>
            <p className="text-xs text-slate-300">
              Préstamo: <strong className="text-white">{rejectingLoan.code}</strong>. Ingrese el motivo formal para el cliente y el expediente:
            </p>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                rows={3}
                placeholder="ej. Capacidad de endeudamiento sobrepasada según buró crediticio."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-rose-500"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingLoan(null)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONDONAR / EXONERAR CARGO */}
      {waivingCharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">Exoneración / Condonación de Cargo</h3>
            <p className="text-xs text-slate-300">
              Cargo: <strong className="text-white">{waivingCharge.description}</strong> por monto de{' '}
              <strong className="text-amber-400">{formatDOP(waivingCharge.amount)}</strong>.
            </p>
            <form onSubmit={handleConfirmWaive} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Justificación para Auditoría (Obligatoria):
                </label>
                <textarea
                  rows={3}
                  placeholder="ej. Acuerdo gerencial por pago total del capital pendiente."
                  value={waiveReason}
                  onChange={(e) => setWaiveReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWaivingCharge(null)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Autorizar Condonación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APLICAR DESCUENTO / REESTRUCTURACIÓN */}
      {discountingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-white text-base">Autorizar Descuento / Acuerdo Gerencial</h3>
            <p className="text-xs text-slate-300">
              Préstamo: <strong className="text-amber-400">{discountingLoan.code}</strong>. Balance actual:{' '}
              <strong className="text-white">{formatDOP(discountingLoan.balance)}</strong>.
            </p>
            <form onSubmit={handleConfirmDiscount} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Monto a Descontar (DOP)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="ej. 2500"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Justificación del Acuerdo</label>
                <textarea
                  rows={2}
                  placeholder="ej. Descuento autorizado por liquidación total de la deuda hoy."
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountingLoan(null)}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Aplicar Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
