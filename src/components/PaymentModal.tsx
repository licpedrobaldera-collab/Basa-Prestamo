import React, { useState } from 'react';
import { Loan, PaymentMethod, PaymentType } from '../types';
import { formatDOP } from '../utils/loanCalculator';
import {
  DollarSign,
  Upload,
  CreditCard,
  Banknote,
  Building,
  CheckCircle,
  X,
  ShieldCheck,
} from 'lucide-react';

interface PaymentModalProps {
  loan: Loan | null;
  clientName: string;
  collectorName: string;
  onClose: () => void;
  onSubmitPayment: (paymentData: {
    loanId: string;
    amount: number;
    capitalPaid: number;
    interestPaid: number;
    lateFeePaid: number;
    paymentType: PaymentType;
    method: PaymentMethod;
    proofPhoto?: string;
    notes?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  loan,
  clientName,
  collectorName,
  onClose,
  onSubmitPayment,
}) => {
  if (!loan) return null;

  const [paymentType, setPaymentType] = useState<PaymentType>('REGULAR');
  const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
  const [amount, setAmount] = useState<number>(loan.quota);
  const [proofPhoto, setProofPhoto] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('•••• •••• •••• 4242');

  // Handle switching payment types
  const handleTypeChange = (type: PaymentType) => {
    setPaymentType(type);
    if (type === 'REGULAR') {
      setAmount(loan.quota);
    } else if (type === 'PAYOFF') {
      setAmount(loan.balance);
    } else if (type === 'INTEREST_ONLY') {
      // Interest portion approximately
      const interestPortion = Math.round(loan.quota * 0.25);
      setAmount(interestPortion);
    } else if (type === 'CAPITAL_ONLY') {
      setAmount(Math.round(loan.quota * 0.75));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProofPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Determine capital vs interest breakdown
  let capitalPaid = 0;
  let interestPaid = 0;
  let lateFeePaid = 0;

  if (paymentType === 'CAPITAL_ONLY') {
    capitalPaid = amount;
    interestPaid = 0;
  } else if (paymentType === 'INTEREST_ONLY') {
    capitalPaid = 0;
    interestPaid = amount;
  } else if (paymentType === 'PAYOFF') {
    capitalPaid = loan.capitalBalance || Math.round(amount * 0.85);
    interestPaid = Math.max(0, amount - capitalPaid);
  } else {
    // REGULAR
    const ratio = loan.totalWithInterest > 0 ? loan.amount / loan.totalWithInterest : 0.8;
    capitalPaid = Math.round(amount * ratio);
    interestPaid = amount - capitalPaid;
  }

  const remainingBalance = Math.max(0, loan.balance - amount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Por favor ingrese un monto válido a cobrar.');
      return;
    }

    onSubmitPayment({
      loanId: loan.id,
      amount,
      capitalPaid,
      interestPaid,
      lateFeePaid,
      paymentType,
      method,
      proofPhoto,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Procesar Cobro / Pago de Préstamo
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <span className="text-slate-500 text-[10px] block">Balance Actual:</span>
              <span className="font-bold text-amber-400 text-sm">
                {formatDOP(loan.balance)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Cuota Regular:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatDOP(loan.quota)}
              </span>
            </div>
          </div>

          {/* Operation Type */}
          <div>
            <label className="text-slate-400 font-medium block mb-1.5">
              Tipo de Operación Financiera *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('REGULAR')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentType === 'REGULAR'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Cuota Regular</div>
                <div className="text-[10px] text-slate-400">Capital + Interés</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('CAPITAL_ONLY')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentType === 'CAPITAL_ONLY'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Abono a Capital</div>
                <div className="text-[10px] text-slate-400">Baja principal directo</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('INTEREST_ONLY')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentType === 'INTEREST_ONLY'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Solo Intereses</div>
                <div className="text-[10px] text-slate-400">Mantiene cuota vigente</div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('PAYOFF')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  paymentType === 'PAYOFF'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-300 font-bold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300'
                }`}
              >
                <div className="font-semibold text-xs">Saldo Total</div>
                <div className="text-[10px] text-slate-400">Liquidación final</div>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-slate-400 font-medium block mb-1.5">
              Canal de Pago / Pasarela *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('EFECTIVO')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'EFECTIVO'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-[11px]">Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('TRANSFERENCIA')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'TRANSFERENCIA'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Building className="w-4 h-4" />
                <span className="text-[11px]">Transferencia</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('TARJETA')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                  method === 'TARJETA'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[11px]">Tarjeta (Online)</span>
              </button>
            </div>
          </div>

          {/* Card Gateway simulated view if TARJETA */}
          {method === 'TARJETA' && (
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold">
                <span>Pasarela de Pago Segura RD (3D Secure)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Número de Tarjeta"
                  className="col-span-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
                <input
                  type="text"
                  placeholder="MM/AA"
                  defaultValue="12/28"
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  defaultValue="889"
                  className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
            </div>
          )}

          {/* Amount to collect */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Monto a Recibir (DOP $) *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              step="50"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-lg font-black text-amber-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Deposit Voucher Upload (Transfer / Cash proof) */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <span className="text-slate-300 font-medium text-[11px] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              Adjuntar Soporte de Depósito o Transferencia (Opcional)
            </span>
            <label className="cursor-pointer block border border-dashed border-slate-700 rounded-lg p-2.5 text-center hover:border-slate-500 transition">
              {proofPhoto ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Comprobante adjuntado con éxito</span>
                </div>
              ) : (
                <div className="text-slate-500 text-[11px]">
                  <span>Haga clic para subir foto del boucher / captura</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Breakdown Preview */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>Abono estimado a capital:</span>
              <span className="font-semibold text-slate-200">{formatDOP(capitalPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Intereses percibidos:</span>
              <span className="font-semibold text-emerald-400">{formatDOP(interestPaid)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-800 text-slate-200">
              <span>Nuevo balance tras cobro:</span>
              <span className="text-amber-400">{formatDOP(remainingBalance)}</span>
            </div>
          </div>

          {/* Submit Action */}
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
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmar y Generar Recibo PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
