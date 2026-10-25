import React, { useState } from 'react';
import { Client, Loan, LoanFrequency, LoanType } from '../types';
import { formatCedula, formatDOP, generateAmortizationSchedule } from '../utils/loanCalculator';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle,
  X,
  CreditCard,
  Camera,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';

interface ClientApplicationModalProps {
  onClose: () => void;
  onSubmitApplication: (clientData: Partial<Client>, loanData: Partial<Loan>) => void;
}

export const ClientApplicationModal: React.FC<ClientApplicationModalProps> = ({
  onClose,
  onSubmitApplication,
}) => {
  // Form State
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(35000);
  const [address, setAddress] = useState('');
  // Datos Bancarios para Desembolso
  const [bankName, setBankName] = useState('Banco de Reservas (Banreservas)');
  const [bankAccountType, setBankAccountType] = useState<'AHORROS' | 'CORRIENTE'>('AHORROS');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [guarantor, setGuarantor] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [collateralType, setCollateralType] = useState<'VEHICULO' | 'ELECTRODOMESTICO' | 'JOYA' | 'OTRO'>('VEHICULO');
  const [collateralDesc, setCollateralDesc] = useState('');

  // Loan parameters
  const [amount, setAmount] = useState(20000);
  const [frequency, setFrequency] = useState<LoanFrequency>('DIARIO');
  const [rate, setRate] = useState(10);
  const [terms, setTerms] = useState(20);
  const [type, setType] = useState<LoanType>('FIXED');

  // Photo uploads (base64)
  const [idFront, setIdFront] = useState<string>('');
  const [idBack, setIdBack] = useState<string>('');
  const [collateralPhoto, setCollateralPhoto] = useState<string>('');

  // AI OCR and Scoring states
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [isScoringAI, setIsScoringAI] = useState(false);
  const [aiScoreData, setAiScoreData] = useState<any>(null);

  // Dynamic preview calculation
  const { quota, totalWithInterest } = generateAmortizationSchedule(
    amount,
    rate,
    terms,
    frequency,
    type
  );

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (b64: string) => void,
    triggerOCR = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setter(result);

      if (triggerOCR) {
        runOcrExtraction(result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const runOcrExtraction = async (base64Data: string, mimeType: string) => {
    setIsScanningOCR(true);
    setOcrResult(null);
    try {
      const res = await fetch('/api/gemini/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOcrResult(data.data);
        if (data.data.nombreCompleto) setName(data.data.nombreCompleto);
        if (data.data.cedula) setCedula(formatCedula(data.data.cedula));
        if (data.data.direccion) setAddress(data.data.direccion);
        if (data.data.ocupacion) setOccupation(data.data.ocupacion);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningOCR(false);
    }
  };

  const runAiPreEvaluation = async () => {
    setIsScoringAI(true);
    setAiScoreData(null);
    try {
      const clientPayload = {
        name: name || 'Solicitante Online',
        cedula,
        occupation: occupation || 'Comercio local informal',
        monthlyIncome,
        address,
        guarantor,
        guarantorPhone,
        collateral: collateralDesc,
        reputation: 'Solicitud web en línea',
      };
      const loanPayload = {
        amount,
        frequency,
        terms,
        rate,
      };

      const res = await fetch('/api/gemini/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client: clientPayload, loanDetails: loanPayload }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiScoreData(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScoringAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cedula || !phone) {
      alert('Por favor complete Nombre, Cédula y Teléfono del solicitante.');
      return;
    }

    const clientData: Partial<Client> = {
      name,
      cedula,
      phone,
      whatsapp: whatsapp || phone,
      occupation,
      monthlyIncome,
      address,
      bankName,
      bankAccountType,
      bankAccountNumber,
      bankAccountHolder: bankAccountHolder || name,
      guarantor,
      guarantorPhone,
      collateralType,
      collateralDesc,
      collateralPhotos: collateralPhoto ? [collateralPhoto] : [],
      idPhotoFront: idFront,
      idPhotoBack: idBack,
    };

    const loanData: Partial<Loan> = {
      amount,
      rate,
      frequency,
      terms,
      type,
      quota,
      totalWithInterest,
      balance: totalWithInterest,
      capitalBalance: amount,
      interestBalance: totalWithInterest - amount,
      closingFee: Math.round(amount * 0.02), // 2% closing fee standard
      netDisbursed: amount - Math.round(amount * 0.02),
      status: aiScoreData?.dictamen === 'RECHAZADO' ? 'RECHAZADO' : 'APROBADO',
      disbursementBank: bankName,
      disbursementAccount: bankAccountNumber,
      disbursementAccountType: bankAccountType,
    };

    onSubmitApplication(clientData, loanData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Solicitud de Préstamo en Línea & Evaluación Rápida
            </h3>
            <p className="text-[11px] text-slate-400">
              Carga digital de Cédula RD, soportes, cálculo de cuota y dictamen Gemini AI.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Document Upload & AI OCR */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-sky-400" />
                Documento de Identidad (Cédula Dominicana) & OCR Automático
              </span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/50">
                Google Vision AI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front ID */}
              <div className="border border-dashed border-slate-700 rounded-xl p-3 text-center bg-slate-900/50 hover:border-amber-500/50 transition">
                <label className="cursor-pointer block">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Cédula Frontal (Anverso)
                  </span>
                  {idFront ? (
                    <img
                      src={idFront}
                      alt="Front ID"
                      className="h-24 mx-auto object-contain rounded"
                    />
                  ) : (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                      <Upload className="w-5 h-5 mb-1" />
                      <span>Subir foto frontal</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setIdFront, true)}
                  />
                </label>
              </div>

              {/* Back ID */}
              <div className="border border-dashed border-slate-700 rounded-xl p-3 text-center bg-slate-900/50 hover:border-amber-500/50 transition">
                <label className="cursor-pointer block">
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Cédula Posterior (Reverso)
                  </span>
                  {idBack ? (
                    <img
                      src={idBack}
                      alt="Back ID"
                      className="h-24 mx-auto object-contain rounded"
                    />
                  ) : (
                    <div className="h-20 flex flex-col items-center justify-center text-slate-500">
                      <Upload className="w-5 h-5 mb-1" />
                      <span>Subir foto reverso</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setIdBack, false)}
                  />
                </label>
              </div>
            </div>

            {isScanningOCR && (
              <div className="flex items-center gap-2 p-2 bg-sky-950/40 text-sky-300 rounded-lg text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extrayendo datos de la Cédula Dominicana con Gemini Vision AI...</span>
              </div>
            )}

            {ocrResult && (
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-[11px] text-emerald-300 flex items-center justify-between">
                <div>
                  <span className="font-bold">Datos OCR Extraídos con Éxito:</span>{' '}
                  {ocrResult.nombreCompleto} ({ocrResult.cedula})
                </div>
                <span className="text-[10px] bg-emerald-900/60 px-2 py-0.5 rounded font-mono">
                  Autocompletado
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Borrower Personal & Contact Data */}
          <div className="space-y-3">
            <h4 className="font-bold text-amber-400 text-xs">Datos del Deudor</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Nombre Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej. Juan Antonio Pérez"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Cédula de Identidad RD *</label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(formatCedula(e.target.value))}
                  required
                  placeholder="001-0000000-0"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Teléfono Celular *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="809-000-0000"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="829-000-0000"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Ingreso Aprox. Mensual (DOP)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Ocupación / Fuente de Ingreso</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Ej. Colmado, Salón, Concho, Empleado"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Dirección / Sector (RD) *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle, No., Sector, Ciudad"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section: Cuenta Bancaria para Desembolso Inmediato */}
          <div className="p-3 bg-slate-900/90 rounded-xl border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sky-400 text-xs flex items-center gap-2">
                <Building className="w-4 h-4" />
                Datos Bancarios para Desembolso (Depósito / Transferencia ACH o LBTR)
              </h4>
              <span className="text-[10px] text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded font-mono font-bold">
                Requerido para Desembolso
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Banco Destino *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium"
                >
                  <option value="Banco de Reservas (Banreservas)">Banco de Reservas (Banreservas)</option>
                  <option value="Banco Popular Dominicano">Banco Popular Dominicano</option>
                  <option value="Banco BHD">Banco BHD</option>
                  <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                  <option value="Asociación Popular de Ahorros y Préstamos (APAP)">Asociación Popular (APAP)</option>
                  <option value="Asociación Cibao de Ahorros y Préstamos (ACAP)">Asociación Cibao (ACAP)</option>
                  <option value="Banco Promerica">Banco Promerica</option>
                  <option value="Scotiabank República Dominicana">Scotiabank RD</option>
                  <option value="Banco BDI">Banco BDI</option>
                  <option value="Banco Vimenca">Banco Vimenca</option>
                  <option value="Banco Ademi">Banco Ademi</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Tipo de Cuenta *</label>
                <select
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value as 'AHORROS' | 'CORRIENTE')}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium"
                >
                  <option value="AHORROS">Cuenta de Ahorros</option>
                  <option value="CORRIENTE">Cuenta Corriente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Número de Cuenta Bancaria *</label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Ej. 960-238491-0"
                  required
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Titular de la Cuenta Bancaria</label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder={name ? name : "Debe coincidir con la cédula del cliente"}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Guarantor & Collateral */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
            <h4 className="font-bold text-amber-400 text-xs">Garante y Garantía Prendaria</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Nombre de Fiador Solidario</label>
                <input
                  type="text"
                  value={guarantor}
                  onChange={(e) => setGuarantor(e.target.value)}
                  placeholder="Opcional"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Teléfono Garante</label>
                <input
                  type="text"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  placeholder="809-000-0000"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Tipo de Garantía</label>
                <select
                  value={collateralType}
                  onChange={(e) => setCollateralType(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="VEHICULO">Vehículo / Motocicleta</option>
                  <option value="ELECTRODOMESTICO">Electrodoméstico / Planta</option>
                  <option value="JOYA">Joya de Oro</option>
                  <option value="OTRO">Otro Bien Mueble</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-400 font-medium">Descripción de la Garantía</label>
                <input
                  type="text"
                  value={collateralDesc}
                  onChange={(e) => setCollateralDesc(e.target.value)}
                  placeholder="Ej. Matrícula Motocicleta Honda C70 o Planta KIPOR 5KW"
                  className="w-full mt-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Loan Calculation & Terms */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/20 space-y-3">
            <h4 className="font-bold text-amber-400 text-xs">Condiciones del Crédito</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-slate-400 font-medium">Monto Solicitado (DOP)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  step="1000"
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">Frecuencia</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="DIARIO">Diario</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Método Amortiz.</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as LoanType)}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="FIXED">Francés (Cuota Fija)</option>
                  <option value="INTEREST_ONLY">Solo Interés (San)</option>
                  <option value="GERMAN">Alemán (Decreciente)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-medium">Tasa Mensual (%)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 font-medium">No. Cuotas</label>
                <input
                  type="number"
                  value={terms}
                  onChange={(e) => setTerms(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            {/* Quick Live Preview */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Cuota periódica:</span>{' '}
                <span className="font-extrabold text-emerald-400 text-sm">
                  {formatDOP(quota)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Total a pagar:</span>{' '}
                <span className="font-bold text-amber-400">
                  {formatDOP(totalWithInterest)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Gastos de Cierre (2%):</span>{' '}
                <span className="text-slate-300">{formatDOP(amount * 0.02)}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Gemini AI Pre-Evaluation */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Evaluación de Riesgo Informal Gemini AI</span>
              </div>
              <button
                type="button"
                onClick={runAiPreEvaluation}
                disabled={isScoringAI}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition flex items-center gap-1.5"
              >
                {isScoringAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analizando perfil...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Evaluar Ahora con IA
                  </>
                )}
              </button>
            </div>

            {aiScoreData && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Puntaje Crediticio:</span>
                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded ${
                        aiScoreData.score > 70
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {aiScoreData.score} / 100
                    </span>
                  </div>
                  <div>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                        aiScoreData.dictamen === 'APROBADO'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {aiScoreData.dictamen}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {aiScoreData.analisis}
                </p>
                {aiScoreData.recomendacionesCobrador && (
                  <p className="text-[10px] text-amber-300/80 italic">
                    💡 Nota Cobrador: {aiScoreData.recomendacionesCobrador}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
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
              Procesar y Formalizar Solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
