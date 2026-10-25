import React, { useState } from 'react';
import { Client, Loan, PaymentTransaction } from '../../types';
import { formatDOP } from '../../utils/loanCalculator';
import {
  Wallet,
  Calendar,
  FileText,
  Clock,
  ArrowUpRight,
  PlusCircle,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  CreditCard,
  Send,
  Sparkles,
} from 'lucide-react';

interface ClientPortalProps {
  client: Client;
  loans: Loan[];
  payments: PaymentTransaction[];
  onRequestNewLoan: (data: {
    amount: number;
    terms: number;
    frequency: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
    purpose: string;
  }) => void;
  onUploadVoucher?: (voucherData: any) => void;
  onOpenReceipt: (payment: PaymentTransaction) => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  client,
  loans,
  payments,
  onRequestNewLoan,
  onUploadVoucher,
  onOpenReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'history' | 'request' | 'statement' | 'voucher'>('loans');

  // Filter client data
  const myLoans = loans.filter((l) => l.clientId === client.id);
  const myPayments = payments.filter((p) => p.clientId === client.id);

  // Financial KPIs
  const totalBalance = myLoans.reduce((acc, l) => acc + l.balance, 0);
  const totalOriginalAmount = myLoans.reduce((acc, l) => acc + l.amount, 0);
  const totalPaidToDate = myPayments.reduce((acc, p) => acc + p.amount, 0);
  const activeLoans = myLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const nextPaymentLoan = activeLoans[0];

  // Loan Request Form State
  const [reqAmount, setReqAmount] = useState(50000);
  const [reqTerms, setReqTerms] = useState(12);
  const [reqFrequency, setReqFrequency] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>('MENSUAL');
  const [reqPurpose, setReqPurpose] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Voucher upload state
  const [vBank, setVBank] = useState('Banco Popular Dominicano');
  const [vRef, setVRef] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState(false);

  // Loan simulation
  const estimatedRate = 2.5; // 2.5% monthly
  const monthlyRateDecimal = estimatedRate / 100;
  const estimatedQuota =
    reqAmount > 0 && reqTerms > 0
      ? (reqAmount * monthlyRateDecimal * Math.pow(1 + monthlyRateDecimal, reqTerms)) /
        (Math.pow(1 + monthlyRateDecimal, reqTerms) - 1)
      : 0;

  const handleSubmittingLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqPurpose.trim()) {
      alert('Por favor especifique el destino o propósito del préstamo.');
      return;
    }
    onRequestNewLoan({
      amount: reqAmount,
      terms: reqTerms,
      frequency: reqFrequency,
      purpose: reqPurpose,
    });
    setRequestSubmitted(true);
  };

  const handleSubmittingVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(vAmount);
    if (!amt || amt <= 0 || !vRef.trim()) {
      alert('Por favor complete el monto y número de referencia bancaria.');
      return;
    }
    if (onUploadVoucher) {
      onUploadVoucher({
        clientId: client.id,
        clientName: client.name,
        bankName: vBank,
        referenceNumber: vRef,
        amountPaid: amt,
        date: new Date().toISOString().split('T')[0],
      });
    }
    setVoucherSuccess(true);
    setVRef('');
    setVAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Client Identity & Financial Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Portal de Autogestión del Prestatario
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                Score: {client.creditScore || 85}/100 (Categoría A+)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
              Bienvenido/a, <span className="text-emerald-400">{client.name}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cédula: <span className="font-mono text-slate-200">{client.cedula}</span> • Tel: {client.phone} • {client.occupation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('request')}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Solicitar Nuevo Crédito
            </button>
            <button
              onClick={() => setActiveTab('voucher')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Notificar Pago Bancario
            </button>
          </div>
        </div>

        {/* 4 Financial Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Balance Total Pendiente</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-1">
              {formatDOP(totalBalance)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {activeLoans.length} crédito(s) activo(s)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Capital Solicitado Histórico</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-1">
              {formatDOP(totalOriginalAmount)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Monto total desembolsado
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Pagado a la Fecha</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {formatDOP(totalPaidToDate)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {myPayments.length} abonos confirmados
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Próxima Cuota</span>
            {nextPaymentLoan ? (
              <>
                <span className="text-xl sm:text-2xl font-black text-sky-400 block mt-1">
                  {formatDOP(nextPaymentLoan.quota)}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Vence: {nextPaymentLoan.startDate ? 'Al día 30 del mes' : 'Próxima semana'}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-bold text-slate-400 block mt-1">Sin cuotas pendientes</span>
                <span className="text-[10px] text-emerald-400 mt-0.5 block">¡Crédito al día!</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'loans'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Mis Préstamos ({myLoans.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Historial de Pagos & Recibos ({myPayments.length})
        </button>

        <button
          onClick={() => setActiveTab('request')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'request'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          Solicitar Préstamo
        </button>

        <button
          onClick={() => setActiveTab('statement')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'statement'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Estado de Cuenta Oficial
        </button>

        <button
          onClick={() => setActiveTab('voucher')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'voucher'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Subir Depósito Bancario
        </button>
      </div>

      {/* TAB CONTENT: MIS PRÉSTAMOS */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Detalle de mis créditos contratados
            </h3>
            <span className="text-xs text-slate-400">
              Total de contratos: {myLoans.length}
            </span>
          </div>

          {myLoans.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-300 font-bold">Actualmente no posee préstamos registrados a su nombre.</p>
              <p className="text-xs text-slate-500 mt-1">Utilice el botón "Solicitar Nuevo Crédito" para realizar una solicitud.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLoans.map((loan) => {
                const percentPaid = loan.amount > 0 ? Math.min(100, Math.round(((loan.amount - loan.balance) / loan.amount) * 100)) : 0;
                return (
                  <div
                    key={loan.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition space-y-4 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {loan.code}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">
                          Préstamo en {loan.frequency}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Asesor asignado: {loan.advisorName || 'Oficial de Crédito'}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          loan.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : loan.status === 'OVERDUE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : loan.status === 'PAID'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {loan.status === 'ACTIVE'
                          ? 'Al Día'
                          : loan.status === 'OVERDUE'
                          ? 'En Atraso'
                          : loan.status === 'PAID'
                          ? 'Saldado'
                          : 'En Evaluación'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Monto Original</span>
                        <span className="font-bold text-white">{formatDOP(loan.amount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Cuota Periódica</span>
                        <span className="font-bold text-emerald-400">{formatDOP(loan.quota)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Balance Pendiente</span>
                        <span className="font-black text-amber-400">{formatDOP(loan.balance)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-slate-400">Progreso de Amortización</span>
                        <span className="text-emerald-400">{percentPaid}% completado</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>Plazo: {loan.terms} cuotas</span>
                      <span>Tasa: {loan.rate}% mensual</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: HISTORIAL DE PAGOS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Historial de Pagos & Comprobantes Digitales
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total recibos: {myPayments.length}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Recibo No.</th>
                    <th className="p-3.5">Fecha & Hora</th>
                    <th className="p-3.5">Concepto</th>
                    <th className="p-3.5">Método</th>
                    <th className="p-3.5">Abono Capital</th>
                    <th className="p-3.5">Interés</th>
                    <th className="p-3.5 text-right">Monto Pagado</th>
                    <th className="p-3.5 text-center">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {myPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No posee pagos registrados en el sistema hasta el momento.
                      </td>
                    </tr>
                  ) : (
                    myPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold font-mono text-amber-400">{p.receiptNumber}</td>
                        <td className="p-3.5 text-slate-300">
                          {p.date} • <span className="text-slate-500">{p.time}</span>
                        </td>
                        <td className="p-3.5 text-slate-200">
                          {p.paymentType === 'REGULAR'
                            ? 'Cuota Ordinaria'
                            : p.paymentType === 'CAPITAL_ONLY'
                            ? 'Abono Extraordinario'
                            : 'Liquidación Total'}
                        </td>
                        <td className="p-3.5 text-slate-300 font-semibold">{p.method}</td>
                        <td className="p-3.5 text-slate-400">{formatDOP(p.capitalPaid)}</td>
                        <td className="p-3.5 text-emerald-400 font-semibold">{formatDOP(p.interestPaid)}</td>
                        <td className="p-3.5 text-right font-black text-white text-sm">
                          {formatDOP(p.amount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onOpenReceipt(p)}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-bold border border-emerald-500/30 transition flex items-center gap-1 mx-auto"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Ver Recibo
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SOLICITUD DE PRÉSTAMO */}
      {activeTab === 'request' && (
        <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Solicitud de Nuevo Préstamo o Refinanciamiento</h3>
              <p className="text-xs text-slate-400">
                Complete el siguiente formulario. La solicitud será evaluada de inmediato por nuestro equipo crediticio.
              </p>
            </div>
          </div>

          {requestSubmitted ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-lg font-black text-white">¡Solicitud Enviada con Éxito!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Su solicitud por <strong className="text-emerald-400">{formatDOP(reqAmount)}</strong> a un plazo de {reqTerms} meses ha sido registrada. Un oficial de crédito se comunicará al {client.phone}.
              </p>
              <button
                onClick={() => setRequestSubmitted(false)}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Crear Otra Solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmittingLoan} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Monto Deseado (DOP)
                  </label>
                  <input
                    type="number"
                    min={5000}
                    max={2000000}
                    step={1000}
                    value={reqAmount}
                    onChange={(e) => setReqAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-black text-lg focus:border-emerald-500 outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Rango de DOP $5,000 a $2,000,000</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Plazo Deseado (Meses / Cuotas)
                  </label>
                  <select
                    value={reqTerms}
                    onChange={(e) => setReqTerms(Number(e.target.value))}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses (1 año)</option>
                    <option value={18}>18 meses</option>
                    <option value={24}>24 meses (2 años)</option>
                    <option value={36}>36 meses (3 años)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Frecuencia de Pago
                  </label>
                  <select
                    value={reqFrequency}
                    onChange={(e) => setReqFrequency(e.target.value as any)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="SEMANAL">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Destino o Propósito del Crédito
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Capital de trabajo, compra inventario"
                    value={reqPurpose}
                    onChange={(e) => setReqPurpose(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Simulation Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Cuota Mensual Estimada (Sistema Francés)</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatDOP(estimatedQuota)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Tasa de referencia aproximada: 2.5% mensual</span>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Enviar Solicitud a Evaluación
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB CONTENT: ESTADO DE CUENTA */}
      {activeTab === 'statement' && (
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">Extracto Financiero Oficial</span>
              <h3 className="text-xl font-black text-white">Estado de Cuenta del Prestatario</h3>
              <p className="text-xs text-slate-400">Fecha de emisión: {new Date().toLocaleDateString('es-DO', { dateStyle: 'long' })}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              Imprimir Extracto Oficial (PDF)
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Titular:</span>
                <span className="font-bold text-white text-sm">{client.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Cédula:</span>
                <span className="font-mono text-slate-300">{client.cedula}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Teléfono:</span>
                <span className="text-slate-300">{client.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Ocupación / Comercio:</span>
                <span className="text-slate-300">{client.occupation}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Modalidad</th>
                  <th className="p-3">Monto Aprobado</th>
                  <th className="p-3">Cuota</th>
                  <th className="p-3">Balance Actual</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-amber-400">{l.code}</td>
                    <td className="p-3 text-slate-300">{l.frequency} ({l.rate}%)</td>
                    <td className="p-3 text-slate-200">{formatDOP(l.amount)}</td>
                    <td className="p-3 text-emerald-400 font-bold">{formatDOP(l.quota)}</td>
                    <td className="p-3 text-amber-400 font-black">{formatDOP(l.balance)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Certificado emitido digitalmente para fines informativos y bancarios.</span>
            <span className="font-bold text-white">PrestDominicana PRO</span>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUBIR COMPROBANTE BANCARIO */}
      {activeTab === 'voucher' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Notificar Pago o Transferencia Bancaria</h3>
              <p className="text-xs text-slate-400">
                Ingrese el número de confirmación o voucher de su depósito para validación inmediata por tesorería.
              </p>
            </div>
          </div>

          {voucherSuccess ? (
            <div className="p-6 text-center rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="font-black text-white text-base">¡Comprobante Notificado!</h4>
              <p className="text-xs text-slate-300">
                Su depósito se encuentra en cola de verificación. Al ser conciliado se emitirá su recibo oficial.
              </p>
              <button
                onClick={() => setVoucherSuccess(false)}
                className="mt-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold"
              >
                Subir Otro Comprobante
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmittingVoucher} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Banco Receptor Dominicano</label>
                <select
                  value={vBank}
                  onChange={(e) => setVBank(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:border-sky-500 outline-none"
                >
                  <option value="Banco Popular Dominicano">Banco Popular Dominicano (BPD)</option>
                  <option value="Banco de Reservas (Banreservas)">Banco de Reservas (Banreservas)</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Asociación Popular de Ahorros y Préstamos (APAP)">APAP</option>
                  <option value="Asociación Cibao de Ahorros y Préstamos">Asociación Cibao</option>
                  <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Número de Autorización / Referencia</label>
                <input
                  type="text"
                  placeholder="ej. REF-9831204 / TR-2026-09"
                  value={vRef}
                  onChange={(e) => setVRef(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono uppercase focus:border-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Monto Depositado (DOP)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={vAmount}
                  onChange={(e) => setVAmount(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-bold focus:border-sky-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Registrar Comprobante para Conciliación
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
