import React, { useState } from 'react';
import { AuthSession, Client, ExtraCharge, JournalEntry, Loan, PaymentTransaction } from '../types';
import { formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  X,
  User,
  DollarSign,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  Building,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  PlusCircle,
  Edit,
  History,
  Phone,
  MessageCircle,
  RotateCcw,
} from 'lucide-react';

interface ClientMovementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  loans: Loan[];
  currentSession: AuthSession;
  journalEntries: JournalEntry[];
  onOpenPaymentForLoan: (loanId: string) => void;
  onOpenAmortizationForLoan: (loan: Loan) => void;
  onOpenExtraCharges: () => void;
  onOpenEditClient: (client: Client) => void;
  onQuickAdjustment: (loanId: string, adjustmentAmount: number, justification: string) => void;
}

export const ClientMovementDetailModal: React.FC<ClientMovementDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  loans,
  currentSession,
  journalEntries,
  onOpenPaymentForLoan,
  onOpenAmortizationForLoan,
  onOpenExtraCharges,
  onOpenEditClient,
  onQuickAdjustment,
}) => {
  if (!isOpen || !client) return null;

  // Filter loans belonging to this client
  const clientLoans = loans.filter((l) => l.clientId === client.id);
  const totalBalance = clientLoans.reduce((sum, l) => sum + l.balance, 0);
  const totalDisbursed = clientLoans.reduce((sum, l) => sum + l.amount, 0);
  const maxOverdueDays = Math.max(0, ...clientLoans.map((l) => l.daysOverdue || 0));

  // Determine aging bucket for this client
  let bucketLabel = 'Vigente (0 a 30 días)';
  let bucketColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  let bucketDescription = 'Al día o con atraso leve menor de 30 días';

  if (maxOverdueDays > 90) {
    bucketLabel = 'Incobrable / Castigada (> 90 días)';
    bucketColor = 'bg-rose-600/25 text-rose-300 border-rose-500/40';
    bucketDescription = 'Atraso crítico superior a 90 días - En ejecución judicial / incautación';
  } else if (maxOverdueDays >= 61) {
    bucketLabel = 'En Mora / Cobro Judicial (61 a 90 días)';
    bucketColor = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
    bucketDescription = 'Atraso de 61 a 90 días - Cobro jurídico y notificación a garantes';
  } else if (maxOverdueDays >= 31) {
    bucketLabel = 'Vencido (31 a 60 días)';
    bucketColor = 'bg-amber-500/25 text-amber-300 border-amber-500/40';
    bucketDescription = 'Atraso de 31 a 60 días - 1 a 2 cuotas pendientes de pago';
  }

  // Quick Adjustment State
  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    clientLoans[0]?.id || ''
  );
  const [adjustmentType, setAdjustmentType] = useState<'DESCUENTO' | 'CARGO'>('DESCUENTO');
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustJustification, setAdjustJustification] = useState<string>('');
  const [adjustSuccessMessage, setAdjustSuccessMessage] = useState<string>('');

  // Tab inside modal: 'MOVIMIENTOS' | 'DIARIO_HISTORICO'
  const [activeTab, setActiveTab] = useState<'MOVIMIENTOS' | 'DIARIO_HISTORICO'>('MOVIMIENTOS');

  // Client Journal Entries
  const clientJournal = journalEntries.filter(
    (j) => j.entityId === client.id || clientLoans.some((l) => l.id === j.entityId)
  );

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Seleccione un préstamo para aplicar el movimiento');
      return;
    }
    if (adjustAmount <= 0) {
      alert('Ingrese un monto válido mayor a 0');
      return;
    }
    if (!adjustJustification.trim() || adjustJustification.trim().length < 6) {
      alert('Se requiere un detalle o justificación obligatoria para el Libro Diario (mínimo 6 caracteres).');
      return;
    }

    const signedAmount = adjustmentType === 'DESCUENTO' ? -adjustAmount : adjustAmount;
    onQuickAdjustment(selectedLoanId, signedAmount, adjustJustification.trim());
    setAdjustSuccessMessage(
      `¡Movimiento aplicado exitosamente con asiento en el Libro Diario! Balance actualizado.`
    );
    setAdjustAmount(0);
    setAdjustJustification('');
    setTimeout(() => setAdjustSuccessMessage(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              RD
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {client.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${bucketColor}`}>
                  {bucketLabel}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {client.cedula}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {bucketDescription} • Contacto: <strong className="text-white">{client.phone}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEditClient(client)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
              title="Editar datos del cliente con justificación de diario"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Editar Datos</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Pendiente</span>
            <span className="text-base sm:text-lg font-black text-amber-400 block mt-0.5">
              {formatDOP(totalBalance)}
            </span>
            <span className="text-[10px] text-slate-500">Deuda activa total</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Desembolsado</span>
            <span className="text-base sm:text-lg font-bold text-slate-200 block mt-0.5">
              {formatDOP(totalDisbursed)}
            </span>
            <span className="text-[10px] text-slate-500">{clientLoans.length} crédito(s)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Días de Atraso Máx.</span>
            <span className={`text-base sm:text-lg font-black block mt-0.5 ${maxOverdueDays > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {maxOverdueDays} días
            </span>
            <span className="text-[10px] text-slate-500">
              {maxOverdueDays === 0 ? 'Al día sin mora' : 'Mora acumulada'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Banco para Desembolso</span>
            <span className="text-xs font-bold text-sky-400 block truncate mt-0.5">
              {client.bankName || 'No registrado'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {client.bankAccountNumber || 'Sin cuenta'}
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('MOVIMIENTOS')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'MOVIMIENTOS'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Préstamos & Movimientos Inmediatos</span>
          </button>

          <button
            onClick={() => setActiveTab('DIARIO_HISTORICO')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'DIARIO_HISTORICO'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico en Libro Diario ({clientJournal.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {activeTab === 'MOVIMIENTOS' ? (
            <>
              {/* Active Loans Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Préstamos Registrados de este Cliente
                  </h3>
                  <button
                    onClick={onOpenExtraCharges}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Cargo Extra (GPS/Notaría)
                  </button>
                </div>

                {clientLoans.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                    Este cliente no posee créditos registrados actualmente.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientLoans.map((l) => (
                      <div
                        key={l.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {l.code}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : l.status === 'OVERDUE'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {l.status === 'ACTIVE' && 'Al Día'}
                              {l.status === 'OVERDUE' && `En Mora (${l.daysOverdue || 0}d)`}
                              {l.status === 'PAID' && 'Saldado'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {l.frequency} ({l.rate}% mes)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                            <span>Monto: <strong>{formatDOP(l.amount)}</strong></span>
                            <span>Cuota: <strong>{formatDOP(l.quota)}</strong></span>
                            <span>Saldo: <strong className="text-amber-400">{formatDOP(l.balance)}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => onOpenAmortizationForLoan(l)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Amortización</span>
                          </button>

                          {l.status !== 'PAID' && (
                            <button
                              onClick={() => onOpenPaymentForLoan(l.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-1 transition"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Cobrar / Abonar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Adjustment with Mandatory Journal Entry */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30">
                <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Hacer Movimiento / Ajuste Contable Inmediato
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  Permite aplicar un cargo extraordinario o un descuento de balance en tiempo real, registrando automáticamente el asiento justificado en el Libro Diario.
                </p>

                {adjustSuccessMessage && (
                  <div className="p-3 mb-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {adjustSuccessMessage}
                  </div>
                )}

                <form onSubmit={handleApplyAdjustment} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Préstamo a Afectar
                      </label>
                      <select
                        value={selectedLoanId}
                        onChange={(e) => setSelectedLoanId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        {clientLoans.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.code} - Saldo: {formatDOP(l.balance)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Tipo de Movimiento
                      </label>
                      <select
                        value={adjustmentType}
                        onChange={(e) => setAdjustmentType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="DESCUENTO">Descuento de Balance (Disminuye deuda)</option>
                        <option value="CARGO">Cargo Extraordinario (Aumenta deuda)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Monto del Movimiento (DOP)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={adjustAmount || ''}
                        onChange={(e) => setAdjustAmount(Number(e.target.value))}
                        placeholder="Ej. 1500"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                      * Detalle o Justificación Obligatoria para el Libro Diario
                    </label>
                    <input
                      type="text"
                      required
                      value={adjustJustification}
                      onChange={(e) => setAdjustJustification(e.target.value)}
                      placeholder="Indique motivo exacto: ej. ajuste por pago adelantado en oficina, compensación autorizada, cargo por traslado..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aplicar Movimiento & Actualizar Todo Ya
                    </button>
                  </div>
                </form>
              </div>

              {/* Collateral & Garante Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Garante & Co-Deudor
                  </h4>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <p>
                      <strong>Fiador (Cat. 4):</strong> {client.guarantor || 'Ninguno'} {client.guarantorPhone ? `(${client.guarantorPhone})` : ''}
                    </p>
                    <p>
                      <strong>Co-deudor (Cat. 5):</strong> {client.coDebtor || 'Ninguno'} {client.coDebtorPhone ? `(${client.coDebtorPhone})` : ''}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h4 className="font-bold text-slate-200 mb-1.5 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                    <Building className="w-3.5 h-3.5 text-sky-400" /> Garantía Prendaria / Hipotecaria
                  </h4>
                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <p>
                      <strong>Tipo:</strong> {client.collateralType || 'Personal'}
                    </p>
                    <p>
                      <strong>Descripción:</strong> {client.collateralDesc || 'Sin descripción de prenda'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Historical Journal View */
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                Historial completo de todas las transacciones, modificaciones, abonos y ajustes asentados en el Libro Diario para este cliente.
              </div>

              {clientJournal.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                  No se han registrado asientos de diario para este cliente aún.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {clientJournal.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {entry.entryNumber}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {entry.actionType}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {entry.date} • {entry.time}
                        </span>
                      </div>

                      <p className="text-xs text-white font-medium bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                        <strong className="text-amber-300">Justificación:</strong> {entry.justification}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                        <span>Autor: <strong className="text-slate-300">{entry.userName}</strong> ({entry.userRole})</span>
                        {entry.changesSummary && (
                          <span className="truncate max-w-xs text-slate-400">
                            {entry.changesSummary}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href={`tel:${client.phone}`}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" /> Llamar
            </a>
            {client.whatsapp && (
              <a
                href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-950 text-emerald-400 hover:bg-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-1 border border-emerald-800"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};
