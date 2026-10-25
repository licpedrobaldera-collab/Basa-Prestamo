import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Mail,
  CheckCircle2,
  Building2,
  DollarSign,
  User,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { formatCedula, formatDOP } from '../utils/loanCalculator';
import { TenantInfo, WorkflowLoan } from './LoanWorkflowPipeline';

interface FiscalInvoiceReceiptModuleProps {
  activeTenant: TenantInfo;
  loans: WorkflowLoan[];
  onOpenGmailDraft?: (draft: { clientName: string; recipientEmail?: string; subject: string; bodyHtml: string }) => void;
}

export const FiscalInvoiceReceiptModule: React.FC<FiscalInvoiceReceiptModuleProps> = ({
  activeTenant,
  loans,
  onOpenGmailDraft,
}) => {
  const [selectedLoan, setSelectedLoan] = useState<WorkflowLoan | null>(
    loans.find((l) => l.stage === 'DESEMBOLSADO') || loans[0] || null
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSendGmail = () => {
    if (!selectedLoan || !onOpenGmailDraft) return;

    const capitalPart = selectedLoan.amount / selectedLoan.termMonths;
    const interestPart = selectedLoan.amount * (selectedLoan.rate / 100);
    const totalLiquidado = capitalPart + interestPart;

    const bodyHtml = `
      <div style="font-family: monospace, sans-serif; max-width: 550px; margin: 0 auto; background: #ffffff; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; color: #0f172a;">
        <div style="text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px;">
          <h2 style="margin: 0; font-size: 18px; text-transform: uppercase;">${activeTenant.name}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #475569;">COMPROBANTE FISCAL DIGITAL LOCAL</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">RNC FACTURACIÓN: 1-30-MSA-88 | ESQUEMA: ${activeTenant.dbSchema}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 16px 0; font-size: 12px;">
          <div><strong>OFICIAL: #REC-2026-T</strong></div>
          <div>Fecha: ${new Date().toISOString().split('T')[0]}</div>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px; margin-bottom: 16px;">
          <div><strong>Cliente Receptor:</strong> ${selectedLoan.clientName}</div>
          <div><strong>Cédula / RNC:</strong> ${selectedLoan.clientId}</div>
          <div><strong>Estructura Préstamo:</strong> ${selectedLoan.id} (${selectedLoan.method})</div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #cbd5e1; text-align: left;">
              <th style="padding: 6px 0;">Concepto</th>
              <th style="padding: 6px 0; text-align: right;">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px 0;">Abono Amortización Programada</td>
              <td style="padding: 8px 0; text-align: right;">${selectedLoan.currency} $${capitalPart.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Intereses Mensuales (${selectedLoan.rate}%)</td>
              <td style="padding: 8px 0; text-align: right;">${selectedLoan.currency} $${interestPart.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid #0f172a; font-weight: bold; font-size: 14px;">
              <td style="padding: 10px 0;">TOTAL LIQUIDADO EN VENTANILLA:</td>
              <td style="padding: 10px 0; text-align: right; color: #0284c7;">${selectedLoan.currency} $${totalLiquidado.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <p style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          Comprobante electrónico certificado con valor fiscal legal.
        </p>
      </div>
    `;

    onOpenGmailDraft({
      clientName: selectedLoan.clientName,
      recipientEmail: selectedLoan.clientEmail,
      subject: `Comprobante Fiscal Digital Oficial #REC-2026-T - ${selectedLoan.clientName}`,
      bodyHtml,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Facturación & Comprobantes Fiscales
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Generación automatizada de recibos electrónicos y comprobantes para el inquilino{' '}
            <strong>{activeTenant.name}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Loan Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Seleccionar Crédito para Emisión de Comprobante
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {loans.map((l) => {
              const isSelected = selectedLoan?.id === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => setSelectedLoan(l)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">{l.id}</span>
                    <span className="text-xs font-bold text-amber-400">
                      {l.currency} ${l.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-white mt-1">{l.clientName}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>Cédula: {l.clientId}</span>
                    <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-medium">
                      {l.stage}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Invoice Receipt Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {selectedLoan ? (
            <div className="w-full max-w-lg space-y-4">
              <div
                id="printable-receipt"
                className="bg-white text-slate-950 p-6 rounded-2xl shadow-2xl border border-slate-200 font-mono text-xs space-y-4"
              >
                {/* Header */}
                <div className="text-center border-b-2 border-dashed border-slate-300 pb-4">
                  <h3 className="font-black text-base text-slate-900 uppercase tracking-tight">
                    {activeTenant.name}
                  </h3>
                  <p className="text-[11px] text-slate-600 font-sans font-semibold uppercase">
                    COMPROBANTE FISCAL DIGITAL LOCAL
                  </p>
                  <p className="text-[10px] text-slate-500">
                    RNC FACTURACIÓN: 1-30-MSA-88 | ESQUEMA: {activeTenant.dbSchema}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex justify-between items-center text-[11px] font-sans pb-2 border-b border-slate-200">
                  <span className="font-bold text-indigo-700">OFICIAL #REC-2026-T</span>
                  <span className="text-slate-500">
                    Generación: {new Date().toISOString().split('T')[0]}
                  </span>
                </div>

                <div className="space-y-1.5 font-sans text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">CLIENTE RECEPTOR:</span>
                    <span className="font-bold text-slate-900">{selectedLoan.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">CÉDULA CIUDADANA:</span>
                    <span className="font-mono text-slate-800">{selectedLoan.clientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">REFERENCIA ESTRUCTURA:</span>
                    <span className="font-mono text-indigo-700 font-bold">{selectedLoan.id}</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase">
                    Desglose Transaccional Oficial:
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500">
                        <th className="py-1">Concepto / Cuota Fiel</th>
                        <th className="py-1 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2">Abono Amortización Programada</td>
                        <td className="py-2 text-right font-bold">
                          {selectedLoan.currency} $
                          {(selectedLoan.amount / selectedLoan.termMonths).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2">
                          Intereses Rentabilidad Mensual ({selectedLoan.rate}%)
                        </td>
                        <td className="py-2 text-right font-bold">
                          {selectedLoan.currency} $
                          {(selectedLoan.amount * (selectedLoan.rate / 100)).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-slate-900 font-bold pt-2">
                    <span className="text-xs">Total Liquidado en Ventanilla:</span>
                    <span className="text-base text-indigo-700 font-extrabold font-mono">
                      {selectedLoan.currency} $
                      {(
                        selectedLoan.amount / selectedLoan.termMonths +
                        selectedLoan.amount * (selectedLoan.rate / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-dashed border-slate-300">
                  <p>Documento fiscal digital respaldado por PrestDominicana PRO</p>
                  <p className="mt-0.5">Válido para fines contables y tributarios</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Emitir y Forzar Impresión Física
                </button>

                {onOpenGmailDraft && (
                  <button
                    type="button"
                    onClick={handleSendGmail}
                    className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer"
                    title="Enviar comprobante por Gmail"
                  >
                    <Mail className="w-4 h-4" />
                    Enviar por Gmail
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs italic bg-slate-900/40 rounded-2xl border border-slate-800 w-full p-8">
              <FileText className="w-8 h-8 mb-2 opacity-30" />
              Selecciona un crédito del listado para generar su comprobante oficial de caja
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
