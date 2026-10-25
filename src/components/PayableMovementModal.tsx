import React, { useState } from 'react';
import { AccountPayable, AuthSession, JournalEntry } from '../types';
import { formatDOP } from '../utils/loanCalculator';
import {
  X,
  Building2,
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Save,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface PayableMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  payable: AccountPayable | null;
  currentSession: AuthSession;
  onUpdatePayable: (updated: AccountPayable, journalEntry: JournalEntry) => void;
  onSettlePayable: (payableId: string, amount: number, justification: string) => void;
}

export const PayableMovementModal: React.FC<PayableMovementModalProps> = ({
  isOpen,
  onClose,
  payable,
  currentSession,
  onUpdatePayable,
  onSettlePayable,
}) => {
  if (!isOpen || !payable) return null;

  const [mode, setMode] = useState<'VIEW' | 'EDIT' | 'PAY'>('VIEW');

  // Edit fields
  const [creditor, setCreditor] = useState(payable.creditor);
  const [amount, setAmount] = useState(payable.amount);
  const [balance, setBalance] = useState(payable.balance);
  const [dueDate, setDueDate] = useState(payable.dueDate);
  const [category, setCategory] = useState(payable.category || 'INVERSIONISTA');
  const [notes, setNotes] = useState(payable.notes || '');

  // Payment / Abono fields
  const [paymentAmount, setPaymentAmount] = useState<number>(payable.balance);
  const [paymentJustification, setPaymentJustification] = useState<string>('');

  // Mandatory Journal Justification for Edit
  const [editJustification, setEditJustification] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Aging Bucket
  const daysOverdue = payable.daysOverdue || 0;
  let bucketLabel = 'Vigente / Por Vencer (0 a 30 días)';
  let bucketColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

  if (daysOverdue > 90) {
    bucketLabel = 'Crítico / Vencido (> 90 días)';
    bucketColor = 'bg-rose-600/25 text-rose-300 border-rose-500/40';
  } else if (daysOverdue >= 61) {
    bucketLabel = 'Mora (61 a 90 días)';
    bucketColor = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
  } else if (daysOverdue >= 31) {
    bucketLabel = 'Vencido (31 a 60 días)';
    bucketColor = 'bg-amber-500/25 text-amber-300 border-amber-500/40';
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJustification.trim() || editJustification.trim().length < 6) {
      setErrorMsg('⚠️ Se requiere un detalle o justificación obligatoria para el Libro Diario (mínimo 6 caracteres).');
      return;
    }
    setErrorMsg('');

    const updated: AccountPayable = {
      ...payable,
      creditor,
      amount: Number(amount),
      balance: Number(balance),
      dueDate,
      category: category as any,
      notes,
    };

    const journalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'CUENTA_POR_PAGAR',
      entityId: payable.id,
      entityName: creditor,
      actionType: 'MODIFICACION',
      justification: editJustification.trim(),
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Modificación de pasivo: Acreedor: ${creditor}, Saldo: DOP ${balance}, Vencimiento: ${dueDate}`,
    };

    onUpdatePayable(updated, journalEntry);
    setMode('VIEW');
  };

  const handleApplyPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      setErrorMsg('El monto debe ser mayor a 0');
      return;
    }
    if (paymentAmount > payable.balance) {
      setErrorMsg('El monto no puede exceder el balance pendiente');
      return;
    }
    if (!paymentJustification.trim() || paymentJustification.trim().length < 6) {
      setErrorMsg('⚠️ Se requiere una justificación detallada para el asiento en el Libro Diario.');
      return;
    }

    onSettlePayable(payable.id, paymentAmount, paymentJustification.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {payable.creditor}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${bucketColor}`}>
                  {bucketLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ID: {payable.id} • Vencimiento: {payable.dueDate} ({daysOverdue > 0 ? `${daysOverdue}d de mora` : 'Al día'})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {mode === 'VIEW' && (
            <>
              {/* Financial Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Pendiente</span>
                  <span className="text-xl font-black text-rose-400 block mt-1">
                    {formatDOP(payable.balance)}
                  </span>
                  <span className="text-[10px] text-slate-500">Obligación actual</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Monto Original</span>
                  <span className="text-xl font-bold text-slate-200 block mt-1">
                    {formatDOP(payable.amount)}
                  </span>
                  <span className="text-[10px] text-slate-500">Pasivo inicial</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Categoría</span>
                  <span className="text-sm font-bold text-amber-400 block mt-1">
                    {payable.category || 'INVERSIONISTA'}
                  </span>
                  <span className="text-[10px] text-slate-500">Tipo de acreedor</span>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <strong className="text-slate-300 block mb-1">Notas / Detalles del Pasivo:</strong>
                <p className="text-slate-400">
                  {payable.notes || 'Sin observaciones registradas.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setMode('PAY')}
                  disabled={payable.balance <= 0}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Abonar o Liquidar Deuda (Asiento Diario)</span>
                </button>

                <button
                  onClick={() => setMode('EDIT')}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar Datos con Justificación de Diario</span>
                </button>
              </div>
            </>
          )}

          {mode === 'PAY' && (
            <form onSubmit={handleApplyPayment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                Registrar pago o abono a <strong>{payable.creditor}</strong>. El movimiento se descontará del balance y se asentará en el Libro Diario.
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Balance Actual Pendiente
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatDOP(payable.balance)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Monto a Pagar / Abonar (DOP) *
                  </label>
                  <input
                    type="number"
                    max={payable.balance}
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500 rounded-xl text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> * Detalle o Justificación Obligatoria para el Libro Diario
                </label>
                <textarea
                  required
                  rows={3}
                  value={paymentJustification}
                  onChange={(e) => setPaymentJustification(e.target.value)}
                  placeholder="Detalle del pago: ej. transferencia bancaria #481920 desde cuenta corriente para liquidar cuota de capital..."
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('VIEW')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar Pago y Registrar en Diario
                </button>
              </div>
            </form>
          )}

          {mode === 'EDIT' && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Acreedor / Inversionista *
                  </label>
                  <input
                    type="text"
                    required
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="INVERSIONISTA">Inversionista de Capital</option>
                    <option value="PROVEEDOR">Proveedor Comercial</option>
                    <option value="TALLER">Taller / Reparaciones</option>
                    <option value="OFICINA">Oficina / Notaría</option>
                    <option value="OTRO">Otro Pasivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Balance Pendiente (DOP)
                  </label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> * Detalle o Justificación Obligatoria para el Libro Diario
                </label>
                <textarea
                  required
                  rows={3}
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  placeholder="Explique el motivo de la edición del pasivo: ej. prórroga de vencimiento acordada, reajuste por notas de crédito..."
                  className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('VIEW')}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios con Asiento en Diario
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
