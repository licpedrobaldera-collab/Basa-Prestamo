import React, { useState } from 'react';
import { Client, Loan, SystemSettings } from '../types';
import { generatePagareNotarialText, formatDOP } from '../utils/loanCalculator';
import { SignaturePad } from './SignaturePad';
import { FileText, Printer, Check, X, ShieldCheck, PenTool } from 'lucide-react';

interface ContractModalProps {
  loan: Loan | null;
  client: Client | null;
  settings: SystemSettings;
  onClose: () => void;
  onSaveSignature: (loanId: string, signatureData: string) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  loan,
  client,
  settings,
  onClose,
  onSaveSignature,
}) => {
  const [signature, setSignature] = useState<string>(loan?.contractSignatureData || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!loan || !client) return null;

  const contractText = generatePagareNotarialText(
    client.name,
    client.cedula,
    client.address,
    settings.companyName,
    settings.rnc,
    loan.amount,
    loan.rate,
    loan.frequency,
    loan.terms,
    loan.quota,
    client.collateralDesc,
    client.guarantor,
    client.guarantorCedula
  );

  const handleSaveSignature = () => {
    if (!signature) {
      alert('Por favor realice la firma en el recuadro antes de formalizar.');
      return;
    }
    onSaveSignature(loan.id, signature);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Pagaré Notarial & Contrato Legal Digital RD
              </h3>
              <p className="text-[11px] text-slate-400">
                Préstamo Ref: {loan.code} • {client.name}
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 bg-slate-950/40">
          {/* Printable Legal Document Box */}
          <div
            id="printable-contract"
            className="bg-white text-slate-900 p-6 sm:p-8 rounded-xl font-serif text-xs sm:text-sm leading-relaxed shadow-lg border border-slate-200"
          >
            <div className="text-center pb-4 mb-4 border-b border-slate-300">
              <h2 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-slate-950">
                {settings.companyName.toUpperCase()}
              </h2>
              <p className="text-[11px] text-slate-600 font-mono">
                RNC: {settings.rnc} • {settings.address} • Tel: {settings.phone}
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-100 text-amber-900 font-mono font-bold text-xs rounded border border-amber-300">
                PAGARÉ NOTARIAL CON FUERZA EJECUTORIA (LEY 834 RD)
              </div>
            </div>

            <div className="whitespace-pre-line text-justify text-slate-800 mb-6 font-sans text-xs">
              {contractText}
            </div>

            {/* Collateral & Guarantee summary */}
            {client.collateralDesc && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-6 font-sans">
                <span className="font-bold text-slate-900">
                  Prenda / Garantía Empeñada:
                </span>{' '}
                {client.collateralDesc} (Tipo: {client.collateralType || 'Bienes Muebles'})
              </div>
            )}

            {/* Signature Area */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end font-sans">
              <div className="text-center">
                <div className="h-20 flex items-center justify-center border-b border-slate-400 mb-2">
                  {signature ? (
                    <img
                      src={signature}
                      alt="Firma Digital"
                      className="max-h-16 object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      [Pendiente de firma en pantalla]
                    </span>
                  )}
                </div>
                <p className="font-bold text-xs text-slate-900">{client.name.toUpperCase()}</p>
                <p className="text-[10px] text-slate-600">Cédula: {client.cedula}</p>
                <p className="text-[10px] text-slate-500 font-semibold">LA PARTE DEUDORA</p>
              </div>

              <div className="text-center">
                <div className="h-20 flex items-center justify-center border-b border-slate-400 mb-2">
                  <div className="text-center">
                    <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto" />
                    <span className="text-[9px] font-mono font-bold text-amber-800">
                      SELLO NOTARIAL DIGITAL
                    </span>
                  </div>
                </div>
                <p className="font-bold text-xs text-slate-900">
                  {settings.companyName.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-600">Por el Acreedor / Notaría</p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  AUTORIZADO Y REGISTRADO
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Signature Pad Section */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <PenTool className="w-4 h-4" />
              <span>Interfaz Táctil para Captura de Firma Digital</span>
            </div>
            <SignaturePad
              onSave={(dataUrl) => setSignature(dataUrl)}
              initialSignature={signature}
              label={`Firma de ${client.name}`}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap gap-2 justify-end">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            Imprimir Contrato
          </button>

          <button
            onClick={handleSaveSignature}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-950"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" />
                ¡Contrato Formalizado!
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Formalizar y Guardar Pagaré
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
