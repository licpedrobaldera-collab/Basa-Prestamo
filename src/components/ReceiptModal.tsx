import React, { useRef } from 'react';
import { PaymentTransaction, SystemSettings } from '../types';
import { formatDOP } from '../utils/loanCalculator';
import { Printer, Share2, X, CheckCircle, ShieldCheck, Mail } from 'lucide-react';

interface ReceiptModalProps {
  payment: PaymentTransaction | null;
  settings: SystemSettings;
  onClose: () => void;
  onSendGmail?: (payment: PaymentTransaction) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  settings,
  onClose,
  onSendGmail,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppMessage = () => {
    return encodeURIComponent(
      `*COMPROBANTE DE PAGO - ${settings.companyName.toUpperCase()}*\n` +
        `----------------------------------------\n` +
        `Recibo No: ${payment.receiptNumber}\n` +
        `Fecha: ${payment.date} ${payment.time}\n` +
        `Cliente: ${payment.clientName}\n` +
        `Préstamo: ${payment.loanCode}\n` +
        `Tipo de Pago: ${payment.paymentType}\n` +
        `Método: ${payment.method}\n` +
        `----------------------------------------\n` +
        `Abono a Capital: ${formatDOP(payment.capitalPaid)}\n` +
        `Interés Cobrado: ${formatDOP(payment.interestPaid)}\n` +
        (payment.lateFeePaid > 0 ? `Mora: ${formatDOP(payment.lateFeePaid)}\n` : '') +
        `*TOTAL PAGADO: ${formatDOP(payment.amount)}*\n` +
        `----------------------------------------\n` +
        `Balance Restante: ${formatDOP(payment.balanceAfter)}\n` +
        `Cobrador: ${payment.collectorName}\n\n` +
        `¡Gracias por su puntualidad!\nSoporte: ${settings.technicalSupportName} Tel: ${settings.technicalSupportPhone}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Recibo Oficial de Pago
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/40">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="bg-white text-slate-950 p-5 rounded-xl font-mono text-xs shadow-md border border-slate-200"
          >
            {/* Header / Brand */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">
                {settings.companyName}
              </h2>
              <p className="text-[10px] text-slate-600">RNC: {settings.rnc}</p>
              <p className="text-[10px] text-slate-600">{settings.address}</p>
              <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
              <div className="mt-2 text-[11px] font-bold bg-slate-100 py-1 rounded">
                COMPROBANTE DE INGRESO A CAJA
              </div>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Recibo:</span>
                <span className="font-bold">{payment.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Fecha y Hora:</span>
                <span>
                  {payment.date} - {payment.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Préstamo Ref:</span>
                <span className="font-bold">{payment.loanCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cliente:</span>
                <span className="font-bold">{payment.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cobrador:</span>
                <span>{payment.collectorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Forma de Pago:</span>
                <span className="font-semibold uppercase">{payment.method}</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-1.5 mb-3 text-[11px] border-b border-dashed border-slate-400 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Concepto:</span>
                <span className="font-semibold">
                  {payment.paymentType === 'REGULAR' && 'Cuota Regular Periódica'}
                  {payment.paymentType === 'CAPITAL_ONLY' && 'Abono Extraordinario a Capital'}
                  {payment.paymentType === 'INTEREST_ONLY' && 'Pago Solo de Intereses'}
                  {payment.paymentType === 'PAYOFF' && 'Saldeo y Cancelación Total'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Abono a Capital:</span>
                <span>{formatDOP(payment.capitalPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Intereses Cobrados:</span>
                <span>{formatDOP(payment.interestPaid)}</span>
              </div>
              {payment.lateFeePaid > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Recargo por Mora:</span>
                  <span>{formatDOP(payment.lateFeePaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-300">
                <span>TOTAL RECIBIDO:</span>
                <span className="text-slate-900">{formatDOP(payment.amount)}</span>
              </div>
            </div>

            {/* Balances */}
            <div className="space-y-1 mb-4 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
              <div className="flex justify-between font-bold">
                <span>NUEVO BALANCE PENDIENTE:</span>
                <span className="text-emerald-700">{formatDOP(payment.balanceAfter)}</span>
              </div>
              {payment.balanceAfter <= 0 && (
                <div className="text-center font-extrabold text-emerald-600 uppercase text-[10px] mt-1">
                  *** PRÉSTAMO SALDADO EN SU TOTALIDAD ***
                </div>
              )}
            </div>

            {/* Thermal Footer */}
            <div className="text-center text-[9px] text-slate-500 space-y-1 pt-1">
              <p>Conserve este recibo como constancia oficial de pago.</p>
              <p>Generado electrónicamente por sistema PrestDominicana PRO</p>
              <div className="pt-2 flex items-center justify-center gap-1 text-[9px] text-slate-600">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>
                  Soporte Técnico: {settings.technicalSupportName} ({settings.technicalSupportPhone})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap gap-2 justify-end">
          {onSendGmail && (
            <button
              onClick={() => onSendGmail(payment)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Enviar por Gmail
            </button>
          )}

          <a
            href={`https://wa.me/?text=${getWhatsAppMessage()}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950"
          >
            <Share2 className="w-4 h-4" />
            Enviar por WhatsApp
          </a>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-950"
          >
            <Printer className="w-4 h-4" />
            Imprimir Recibo (58/80mm o PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
