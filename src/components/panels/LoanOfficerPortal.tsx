import React, { useState, useMemo } from 'react';
import { Client, Loan, PaymentTransaction } from '../../types';
import { formatDOP, formatCedula, generateAmortizationSchedule } from '../../utils/loanCalculator';
import {
  FileText,
  UserPlus,
  Calculator,
  Inbox,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Eye,
  Printer,
  ShieldCheck,
  Building2,
  DollarSign,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface LoanOfficerPortalProps {
  officerName: string;
  clients: Client[];
  loans: Loan[];
  payments: PaymentTransaction[];
  onRegisterClient: (newClient: Partial<Client>) => void;
  onCreateLoanApplication: (loanData: any) => void;
  onForwardToManager: (loanId: string, notes: string) => void;
  onOfficePayment: (loanId: string, amount: number, method: 'EFECTIVO' | 'TRANSFERENCIA') => void;
}

export const LoanOfficerPortal: React.FC<LoanOfficerPortalProps> = ({
  officerName,
  clients,
  loans,
  payments,
  onRegisterClient,
  onCreateLoanApplication,
  onForwardToManager,
  onOfficePayment,
}) => {
  const [activeTab, setActiveTab] = useState<'intake' | 'simulator' | 'pipeline' | 'counter'>('pipeline');

  // Search in counter or intake
  const [searchTerm, setSearchTerm] = useState('');

  // 1. New Client Intake Form State
  const [clientName, setClientName] = useState('');
  const [clientCedula, setClientCedula] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientOccupation, setClientOccupation] = useState('');
  const [clientIncome, setClientIncome] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGuarantor, setClientGuarantor] = useState('');
  const [clientGuarantorPhone, setClientGuarantorPhone] = useState('');
  const [clientCoDebtor, setClientCoDebtor] = useState('');
  const [clientSuccessMsg, setClientSuccessMsg] = useState(false);

  // 2. New Loan Application on Intake
  const [selectedClientIdForLoan, setSelectedClientIdForLoan] = useState<string>('');
  const [appAmount, setAppAmount] = useState('100000');
  const [appTerms, setAppTerms] = useState('12');
  const [appRate, setAppRate] = useState('2.5');
  const [appFrequency, setAppFrequency] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>('MENSUAL');
  const [appType, setAppType] = useState<'FIXED' | 'GERMAN' | 'INTEREST_ONLY'>('FIXED');

  // 3. Simulator State
  const [simAmount, setSimAmount] = useState<number>(150000);
  const [simTerms, setSimTerms] = useState<number>(12);
  const [simRate, setSimRate] = useState<number>(2.5);
  const [simFrequency, setSimFrequency] = useState<'MENSUAL' | 'QUINCENAL' | 'SEMANAL'>('MENSUAL');
  const [simMethod, setSimMethod] = useState<'FIXED' | 'GERMAN' | 'INTEREST_ONLY'>('FIXED');

  const simResult = useMemo(() => {
    return generateAmortizationSchedule(simAmount, simRate, simTerms, simFrequency, simMethod);
  }, [simAmount, simRate, simTerms, simFrequency, simMethod]);

  const simSchedule = simResult.schedule;

  // 4. Counter Payment State
  const [counterLoanId, setCounterLoanId] = useState<string>('');
  const [counterAmount, setCounterAmount] = useState<string>('');
  const [counterMethod, setCounterMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [counterSuccess, setCounterSuccess] = useState(false);

  // Forwarding modal
  const [forwardingLoan, setForwardingLoan] = useState<Loan | null>(null);
  const [forwardNotes, setForwardNotes] = useState('');

  // Pending loans ready for preliminary check
  const pendingLoans = loans.filter((l) => l.status === 'EN_TRAMITE');

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm) ||
      c.phone.includes(searchTerm)
  );

  const handleRegisterClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientCedula.trim()) {
      alert('Nombre y cédula son obligatorios');
      return;
    }
    const newClient: Partial<Client> = {
      id: `CLI-${Date.now()}`,
      name: clientName.trim(),
      cedula: formatCedula(clientCedula),
      phone: clientPhone,
      whatsapp: clientPhone,
      occupation: clientOccupation || 'Comerciante Independiente',
      monthlyIncome: parseFloat(clientIncome) || 35000,
      address: clientAddress || 'Santo Domingo, RD',
      guarantor: clientGuarantor || undefined,
      guarantorPhone: clientGuarantorPhone || undefined,
      coDebtor: clientCoDebtor || undefined,
      creditScore: 80,
    };
    onRegisterClient(newClient);
    setClientSuccessMsg(true);
    setSelectedClientIdForLoan(newClient.id!);
    // Reset inputs
    setClientName('');
    setClientCedula('');
    setClientPhone('');
    setClientOccupation('');
    setClientIncome('');
    setClientAddress('');
    setClientGuarantor('');
    setClientGuarantorPhone('');
    setClientCoDebtor('');
  };

  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientIdForLoan) {
      alert('Seleccione un cliente para la solicitud');
      return;
    }
    onCreateLoanApplication({
      clientId: selectedClientIdForLoan,
      amount: parseFloat(appAmount),
      terms: parseInt(appTerms),
      rate: parseFloat(appRate),
      frequency: appFrequency,
      type: appType,
      advisorName: officerName,
      status: 'EN_TRAMITE',
    });
    alert('¡Expediente de préstamo creado y colocado en bandeja de revisión!');
    setActiveTab('pipeline');
  };

  const handleExecuteCounterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(counterAmount);
    if (!counterLoanId || !amt || amt <= 0) {
      alert('Seleccione el préstamo y el monto recibido');
      return;
    }
    onOfficePayment(counterLoanId, amt, counterMethod);
    setCounterSuccess(true);
    setCounterAmount('');
  };

  const handleSendToManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardingLoan) return;
    onForwardToManager(forwardingLoan.id, forwardNotes || 'Requisitos verificados por Auxiliar de Préstamos');
    setForwardingLoan(null);
    setForwardNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                Panel de Auxiliar de Préstamos & Ventanilla
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                Oficial: {officerName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Gestión Operativa de Solicitudes & Expedientes
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registro de clientes, corrida de tablas de amortización, cobros en oficina y remisión a Gerencia para aprobación.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('intake')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Cliente / Expediente
            </button>
            <button
              onClick={() => setActiveTab('counter')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-emerald-500/30 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              Caja Ventanilla
            </button>
          </div>
        </div>

        {/* 4 KPIs for Loan Officer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Expedientes en Trámite</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-1">
              {pendingLoans.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Pendientes de dictamen</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Base de Clientes</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-1">
              {clients.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Prestatarios registrados</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Créditos Colocados</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {loans.filter((l) => l.status === 'ACTIVE').length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Cartera activa gestionada</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Recaudado en Ventanilla</span>
            <span className="text-xl sm:text-2xl font-black text-sky-400 block mt-1">
              {formatDOP(payments.reduce((s, p) => s + p.amount, 0))}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Total cobrado en oficina</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'pipeline'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Bandeja de Expedientes ({pendingLoans.length})
        </button>

        <button
          onClick={() => setActiveTab('intake')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'intake'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Ingreso de Clientes & Solicitudes
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Simulador de Amortización
        </button>

        <button
          onClick={() => setActiveTab('counter')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'counter'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Atención en Ventanilla
        </button>
      </div>

      {/* TAB: BANDEJA DE EXPEDIENTES (PASE AL GERENTE) */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4 text-indigo-400" />
              Expedientes Pendientes de Revisión & Pase a Gerencia
            </h3>
            <span className="text-xs text-slate-400">
              {pendingLoans.length} solicitudes en etapa de verificación preliminar
            </span>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-200 font-bold">¡Bandeja al día! No hay solicitudes pendientes de trámite.</p>
              <p className="text-xs text-slate-500 mt-1">Utilice la pestaña "Ingreso de Clientes" para crear una nueva solicitud.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLoans.map((loan) => {
                const client = clients.find((c) => c.id === loan.clientId);
                return (
                  <div
                    key={loan.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 transition space-y-4 shadow-xl"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                          {loan.code}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{client?.name || 'Cliente'}</h4>
                        <p className="text-xs text-slate-400">
                          Cédula: {client?.cedula} • Tel: {client?.phone}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {loan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Monto Solicitado:</span>
                        <span className="font-bold text-white">{formatDOP(loan.amount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Cuota Calculada:</span>
                        <span className="font-bold text-emerald-400">{formatDOP(loan.quota)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Plazo / Tasa:</span>
                        <span className="text-slate-300 font-semibold">{loan.terms} m • {loan.rate}%</span>
                      </div>
                    </div>

                    {/* Check list de Requisitos del Auxiliar */}
                    <div className="p-3 bg-slate-950/60 rounded-xl text-[11px] space-y-1.5 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Checklist Preliminar Requerido:</span>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cédula dominicana y dirección verificadas</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Capacidad de pago calculada según ingresos</span>
                      </div>
                      {client?.guarantor ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Garante solidario asignado: {client.guarantor}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Sin fiador prendario (Crédito personal a sola firma)</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setForwardingLoan(loan)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Remitir a Bandeja del Gerente para Aprobación
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: INGRESO DE CLIENTES & SOLICITUDES */}
      {activeTab === 'intake' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Registration Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-black text-white text-base">Paso 1: Alta de Nuevo Cliente</h3>
                <p className="text-xs text-slate-400">Registro de identidad dominicana y garantes</p>
              </div>
            </div>

            {clientSuccessMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <span>✓ ¡Cliente guardado exitosamente en el catálogo!</span>
                <button onClick={() => setClientSuccessMsg(false)} className="text-slate-400">✕</button>
              </div>
            )}

            <form onSubmit={handleRegisterClientSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="ej. Manuel Emilio Santos"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Cédula Dominicana *</label>
                  <input
                    type="text"
                    placeholder="001-XXXXXXX-X"
                    value={clientCedula}
                    onChange={(e) => setClientCedula(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Teléfono Móvil / WhatsApp *</label>
                  <input
                    type="text"
                    placeholder="809-555-0199"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Ingreso Mensual Estimado (DOP)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={clientIncome}
                    onChange={(e) => setClientIncome(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Ocupación / Actividad Comercial</label>
                <input
                  type="text"
                  placeholder="ej. Colmado, Taller mecánico, Empleado privado"
                  value={clientOccupation}
                  onChange={(e) => setClientOccupation(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Dirección Residencial / Negocio</label>
                <input
                  type="text"
                  placeholder="ej. Av. 27 de Febrero #45, Ensanche La Fe, DN"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Datos de Garante / Fiador Solidario</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre Garante"
                    value={clientGuarantor}
                    onChange={(e) => setClientGuarantor(e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono Garante"
                    value={clientGuarantorPhone}
                    onChange={(e) => setClientGuarantorPhone(e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Cliente en la Base de Datos
              </button>
            </form>
          </div>

          {/* Create Loan Application for client */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-black text-white text-base">Paso 2: Apertura de Solicitud de Crédito</h3>
                <p className="text-xs text-slate-400">Parametrización del préstamo y cuotas</p>
              </div>
            </div>

            <form onSubmit={handleCreateLoanSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Seleccionar Cliente Titular *</label>
                <select
                  value={selectedClientIdForLoan}
                  onChange={(e) => setSelectedClientIdForLoan(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold outline-none focus:border-purple-500"
                  required
                >
                  <option value="">-- Seleccione Cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.cedula}) - {c.occupation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Monto Principal (DOP) *</label>
                  <input
                    type="number"
                    step="1000"
                    value={appAmount}
                    onChange={(e) => setAppAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-base font-black outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Plazo (Cuotas) *</label>
                  <input
                    type="number"
                    value={appTerms}
                    onChange={(e) => setAppTerms(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Tasa Mensual (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={appRate}
                    onChange={(e) => setAppRate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Frecuencia</label>
                  <select
                    value={appFrequency}
                    onChange={(e) => setAppFrequency(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="SEMANAL">Semanal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Método de Amortización</label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                >
                  <option value="FIXED">Francés (Cuota Fija Capital + Interés)</option>
                  <option value="GERMAN">Alemán (Capital Fijo, Cuota Decreciente)</option>
                  <option value="INTEREST_ONLY">Solo Interés (San Dominicano)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Crear Expediente y Enviar a Bandeja de Revisión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: SIMULADOR DE AMORTIZACIÓN */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              Simulador Financiero & Tabla de Amortización para Clientes
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Monto (DOP)</label>
                <input
                  type="number"
                  step="5000"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Tasa Mensual (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={simRate}
                  onChange={(e) => setSimRate(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Plazo (Cuotas)</label>
                <input
                  type="number"
                  value={simTerms}
                  onChange={(e) => setSimTerms(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Frecuencia</label>
                <select
                  value={simFrequency}
                  onChange={(e) => setSimFrequency(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                >
                  <option value="MENSUAL">Mensual</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="SEMANAL">Semanal</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Método</label>
                <select
                  value={simMethod}
                  onChange={(e) => setSimMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                >
                  <option value="FIXED">Francés (Fijo)</option>
                  <option value="GERMAN">Alemán (Decreciente)</option>
                  <option value="INTEREST_ONLY">Solo Interés</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase">
                Proyección de Cuotas ({simSchedule.length} vencimientos)
              </span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Tabla para Cliente
              </button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-3">No.</th>
                    <th className="p-3">Fecha Vencimiento</th>
                    <th className="p-3">Cuota Total</th>
                    <th className="p-3">Abono Capital</th>
                    <th className="p-3">Interés</th>
                    <th className="p-3">Balance Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {simSchedule.map((row) => (
                    <tr key={row.periodNumber} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{row.periodNumber}</td>
                      <td className="p-3 text-slate-300 font-sans">{row.dueDate}</td>
                      <td className="p-3 font-black text-emerald-400">{formatDOP(row.totalQuota)}</td>
                      <td className="p-3 text-slate-200">{formatDOP(row.principal)}</td>
                      <td className="p-3 text-amber-400">{formatDOP(row.interest)}</td>
                      <td className="p-3 font-bold text-slate-400">{formatDOP(row.remainingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ATENCIÓN EN VENTANILLA (COBRO OFICINA) */}
      {activeTab === 'counter' && (
        <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-black text-white text-base">Atención en Ventanilla (Cobro Presencial)</h3>
              <p className="text-xs text-slate-400">Recepción de cuotas en oficina y emisión de recibo físico</p>
            </div>
          </div>

          {counterSuccess && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-sm">¡Pago Aplicado en Ventanilla!</h4>
              <p className="text-xs text-slate-300">El comprobante fiscal y recibo de caja han sido registrados.</p>
              <button
                onClick={() => setCounterSuccess(false)}
                className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
              >
                Cobrar a Otro Cliente
              </button>
            </div>
          )}

          <form onSubmit={handleExecuteCounterPayment} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Seleccionar Préstamo del Cliente
              </label>
              <select
                value={counterLoanId}
                onChange={(e) => {
                  setCounterLoanId(e.target.value);
                  const l = loans.find((item) => item.id === e.target.value);
                  if (l) setCounterAmount(l.quota.toString());
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-emerald-500 outline-none"
                required
              >
                <option value="">-- Seleccionar Préstamo Activo --</option>
                {loans
                  .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
                  .map((l) => {
                    const c = clients.find((client) => client.id === l.clientId);
                    return (
                      <option key={l.id} value={l.id}>
                        {l.code} - {c?.name} | Balance: {formatDOP(l.balance)} (Cuota: {formatDOP(l.quota)})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Monto Recibido en Caja (DOP)</label>
              <input
                type="number"
                step="any"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-lg font-black focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Método de Cobro</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCounterMethod('EFECTIVO')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    counterMethod === 'EFECTIVO'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  💵 Efectivo en Caja
                </button>
                <button
                  type="button"
                  onClick={() => setCounterMethod('TRANSFERENCIA')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    counterMethod === 'TRANSFERENCIA'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  📲 Transferencia Bancaria
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aplicar Pago en Ventanilla & Generar Recibo
            </button>
          </form>
        </div>
      )}

      {/* MODAL: REMITIR EXPEDIENTE AL GERENTE */}
      {forwardingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Pase a Bandeja del Gerente</h3>
              <button onClick={() => setForwardingLoan(null)} className="text-slate-400">✕</button>
            </div>
            <p className="text-xs text-slate-300">
              Préstamo: <strong className="text-amber-400">{forwardingLoan.code}</strong> por monto de{' '}
              <strong className="text-white">{formatDOP(forwardingLoan.amount)}</strong>.
            </p>
            <form onSubmit={handleSendToManager} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notas / Dictamen Preliminar del Auxiliar
                </label>
                <textarea
                  rows={3}
                  placeholder="ej. Documentación completa, garante solvente verificado vía telefónica."
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Confirmar Envío a Aprobación Gerencial
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
