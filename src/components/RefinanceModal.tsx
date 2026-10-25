import React, { useState } from 'react';
import { Loan, LoanFrequency } from '../types';
import { formatDOP, generateAmortizationSchedule } from '../utils/loanCalculator';
import { RefreshCw, CheckCircle, X, ArrowRight, DollarSign } from 'lucide-react';

interface RefinanceModalProps {
  loan: Loan | null;
  clientName: string;
  onClose: () => void;
  onConfirmRefinance: (oldLoanId: string, newLoanData: Partial<Loan>) => void;
}

export const RefinanceModal: React.FC<RefinanceModalProps> = ({
  loan,
  clientName,
  onClose,
  onConfirmRefinance,
}) => {
  if (!loan) return null;

  const currentBalance = loan.balance;
  const [newAmount, setNewAmount] = useState<number>(currentBalance + 15000);
  const [rate, setRate] = useState<number>(loan.rate);
  const [terms, setTerms] = useState<number>(loan.terms);
  const [frequency, setFrequency] = useState<LoanFrequency>(loan.frequency);
  const [closingFee, setClosingFee] = useState<number>(500);

  const { quota, totalWithInterest } = generateAmortizationSchedule(
    newAmount,
    rate,
    terms,
    frequency,
    'FIXED'
  );

  const netCashToDeliver = Math.max(0, newAmount - currentBalance - closingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= currentBalance) {
      alert('El nuevo monto del reenganche debe ser mayor al balance pendiente actual.');
      return;
    }

    const newLoanData: Partial<Loan> = {
      clientId: loan.clientId,
      amount: newAmount,
      rate,
      terms,
      frequency,
      type: 'FIXED',
      closingFee,
      netDisbursed: netCashToDeliver,
      quota,
      totalWithInterest,
      balance: totalWithInterest,
      capitalBalance: newAmount,
      interestBalance: totalWithInterest - newAmount,
      status: 'ACTIVE',
      notes: `Reenganche automático de préstamo anterior ${loan.code}. Saldo unificado de ${formatDOP(currentBalance)}.`,
    };

    onConfirmRefinance(loan.id, newLoanData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Reenganche / Refinanciamiento Rápido RD
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {loan.code} • {clientName}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Unification banner */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Saldo actual a cancelar:</span>
              <span className="font-bold text-rose-400 text-sm">
                {formatDOP(currentBalance)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Este saldo quedará cancelado en su totalidad mediante la nueva colocación.
            </p>
          </div>

          {/* New parameters */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-slate-400 font-medium block mb-1">
                Nuevo Monto Total a Prestar (DOP $) *
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                required
                step="1000"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold text-base"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Frecuencia de Cobro
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              >
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Tasa Mensual %</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Cantidad Cuotas</label>
              <input
                type="number"
                value={terms}
                onChange={(e) => setTerms(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Gastos Cierre / Notaría (DOP)
              </label>
              <input
                type="number"
                value={closingFee}
                onChange={(e) => setClosingFee(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>

          {/* Liquid to deliver breakdown */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span>Nueva Cuota Periódica:</span>
              <span className="font-bold text-amber-400">{formatDOP(quota)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total a Pagar con Intereses:</span>
              <span className="text-slate-300 font-medium">
                {formatDOP(totalWithInterest)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-800/40 flex justify-between items-center text-sm font-extrabold text-emerald-400">
              <span>Efectivo Neto a Entregar al Cliente:</span>
              <span className="text-base">{formatDOP(netCashToDeliver)}</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-950 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aprobar Reenganche
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
