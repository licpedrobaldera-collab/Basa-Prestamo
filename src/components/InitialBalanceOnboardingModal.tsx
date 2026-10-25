import React, { useState } from 'react';
import { AuthSession, Client, JournalEntry, Loan, LoanFrequency, LoanType, PaymentTransaction } from '../types';
import { formatCedula, formatDOP, generateAmortizationSchedule } from '../utils/loanCalculator';
import {
  X,
  UserPlus,
  Scale,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  History,
  Calculator,
  Building,
  User,
  CreditCard,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InitialBalanceOnboardingModalProps {
  isOpen: boolean;
  currentSession: AuthSession;
  onClose: () => void;
  onCompleteOnboarding: (data: {
    client: Client;
    loan: Loan;
    initialPayments: PaymentTransaction[];
    journalEntry: JournalEntry;
  }) => void;
}

export const InitialBalanceOnboardingModal: React.FC<InitialBalanceOnboardingModalProps> = ({
  isOpen,
  currentSession,
  onClose,
  onCompleteOnboarding,
}) => {
  // Modalidad seleccionada
  // 'MODALIDAD_A': Carga de Histórico Completo / Ficha de Control Excepcional (sin constancia previa)
  // 'MODALIDAD_B': Continuidad desde Saldo al Día de Hoy con Programación de Cuotas Pendientes
  const [modalidad, setModalidad] = useState<'MODALIDAD_A' | 'MODALIDAD_B'>('MODALIDAD_B');

  // Datos del Cliente
  const [clientName, setClientName] = useState('');
  const [clientCedula, setClientCedula] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientOccupation, setClientOccupation] = useState('Comercio Independiente / Colmado');
  const [clientMonthlyIncome, setClientMonthlyIncome] = useState(35000);
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');

  // Parámetros comunes
  const [frequency, setFrequency] = useState<LoanFrequency>('DIARIO');
  const [loanType, setLoanType] = useState<LoanType>('FIXED');
  const [rate, setRate] = useState(10);
  const [advisorName, setAdvisorName] = useState(currentSession.name || 'Lic Pedro Baldera');
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState(
    'Migración e ingreso de cliente con balance inicial para continuidad de cobro en sistema'
  );

  // --- MODALIDAD A: Ficha Histórica / Casos Excepcionales ---
  const [histOriginalAmount, setHistOriginalAmount] = useState(50000);
  const [histOriginalDate, setHistOriginalDate] = useState('2026-06-01');
  const [histTotalTerms, setHistTotalTerms] = useState(30);
  const [histPaymentsMadeCount, setHistPaymentsMadeCount] = useState(18);
  const [histTotalPaidAmount, setHistTotalPaidAmount] = useState(30000);
  const [histOutstandingBalance, setHistOutstandingBalance] = useState(20000);
  const [histControlFichaNumber, setHistControlFichaNumber] = useState('FICHA-EXC-001');

  // --- MODALIDAD B: Continuidad Saldo al Día de Hoy con Programación ---
  const [modBInitialAmount, setModBInitialAmount] = useState(60000); // Cuánto fue el saldo inicial del préstamo
  const [modBTotalPaid, setModBTotalPaid] = useState(25000); // Cuánto ha pagado a la fecha
  const [modBCurrentBalance, setModBCurrentBalance] = useState(35000); // Saldo al día de hoy
  const [modBPendingInstallments, setModBPendingInstallments] = useState(14); // Cuántas cuotas están pendientes
  const [modBFixedQuota, setModBFixedQuota] = useState(2500); // Cuota fija periódica
  const [modBNextDueDate, setModBNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  if (!isOpen) return null;

  // Actualizar cálculo dinámico en Modalidad B
  const handleModBBalanceChange = (newBalance: number) => {
    setModBCurrentBalance(newBalance);
    if (modBPendingInstallments > 0) {
      setModBFixedQuota(Math.round(newBalance / modBPendingInstallments));
    }
  };

  const handleModBInstallmentsChange = (count: number) => {
    setModBPendingInstallments(count);
    if (count > 0 && modBCurrentBalance > 0) {
      setModBFixedQuota(Math.round(modBCurrentBalance / count));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !clientCedula.trim()) {
      alert('Por favor ingrese el Nombre Completo y Cédula del Cliente.');
      return;
    }

    if (!justification.trim()) {
      alert('Debe ingresar un detalle o justificación obligatoria para el Libro Diario.');
      return;
    }

    const clientId = `CLI-${Date.now().toString().slice(-4)}`;
    const loanId = `LN-${Date.now().toString().slice(-4)}`;
    const loanCode = `PR-MIG-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`;
    const nowISO = new Date().toISOString().split('T')[0];

    const newClient: Client = {
      id: clientId,
      name: clientName.trim(),
      cedula: formatCedula(clientCedula),
      phone: clientPhone || '809-555-0000',
      whatsapp: (clientPhone || '8095550000').replace(/\D/g, ''),
      occupation: clientOccupation,
      monthlyIncome: clientMonthlyIncome,
      address: clientAddress || 'Santo Domingo, República Dominicana',
      guarantor: guarantorName || undefined,
      guarantorPhone: guarantorPhone || undefined,
      password: 'Cliente2026*',
      createdAt: nowISO,
      notes: `[Ingreso con Balance Inicial - ${modalidad === 'MODALIDAD_A' ? 'Ficha Histórica Excepcional' : 'Saldo al Día de Hoy'}] ${notes}`,
    };

    let newLoan: Loan;
    const initialPayments: PaymentTransaction[] = [];

    if (modalidad === 'MODALIDAD_A') {
      // Modalidad A: Ficha Histórica / Casos Excepcionales
      const remainingBalance = Math.max(0, histOutstandingBalance);
      const remainingTerms = Math.max(1, histTotalTerms - histPaymentsMadeCount);
      const calculatedQuota = Math.round(remainingBalance / remainingTerms);

      // Generar tabla de amortización para las cuotas restantes
      const schedule = Array.from({ length: remainingTerms }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + (i + 1) * (frequency === 'DIARIO' ? 1 : frequency === 'SEMANAL' ? 7 : 15));
        return {
          installmentNumber: histPaymentsMadeCount + i + 1,
          dueDate: d.toISOString().split('T')[0],
          quota: calculatedQuota,
          capital: Math.round(calculatedQuota * 0.85),
          interest: Math.round(calculatedQuota * 0.15),
          balanceRemaining: Math.max(0, remainingBalance - calculatedQuota * (i + 1)),
          status: 'PENDIENTE' as const,
        };
      });

      newLoan = {
        id: loanId,
        code: loanCode,
        clientId: newClient.id,
        amount: histOriginalAmount,
        closingFee: 0,
        netDisbursed: histOriginalAmount,
        rate,
        frequency,
        type: loanType,
        terms: histTotalTerms,
        quota: calculatedQuota,
        totalWithInterest: histOriginalAmount + (histOriginalAmount * rate) / 100,
        balance: remainingBalance,
        capitalBalance: Math.round(remainingBalance * 0.85),
        interestBalance: Math.round(remainingBalance * 0.15),
        totalPaid: histTotalPaidAmount,
        status: remainingBalance > 0 ? 'ACTIVE' : 'PAID',
        advisorId: 'USR-01',
        advisorName,
        createdDate: histOriginalDate,
        dueDate: schedule[schedule.length - 1]?.dueDate || nowISO,
        contractSigned: true,
        daysOverdue: 0,
        schedule,
        notes: `Cargado mediante Ficha de Control ${histControlFichaNumber}. Histórico: ${histPaymentsMadeCount} pagos realizados por DOP ${histTotalPaidAmount}. Saldo a continuar: DOP ${remainingBalance}.`,
      };

      // Si registró pagos previos, crear el comprobante histórico de la ficha
      if (histTotalPaidAmount > 0) {
        initialPayments.push({
          id: `PAY-HIST-${Date.now()}`,
          receiptNumber: `REC-FICHA-${histControlFichaNumber}`,
          loanId: newLoan.id,
          loanCode: newLoan.code,
          clientId: newClient.id,
          clientName: newClient.name,
          amount: histTotalPaidAmount,
          capitalPaid: Math.round(histTotalPaidAmount * 0.85),
          interestPaid: Math.round(histTotalPaidAmount * 0.15),
          lateFeePaid: 0,
          paymentType: 'REGULAR',
          method: 'EFECTIVO',
          date: histOriginalDate,
          time: '12:00 PM',
          collectorName: advisorName,
          balanceAfter: remainingBalance,
          notes: `Histórico acumulado según ficha de control ${histControlFichaNumber} sin constancia previa física`,
        });
      }
    } else {
      // Modalidad B: Continuidad Saldo al Día de Hoy con Programación
      const balanceToCollect = Math.max(0, modBCurrentBalance);
      const pendingTerms = Math.max(1, modBPendingInstallments);
      const fixedQuota = modBFixedQuota > 0 ? modBFixedQuota : Math.round(balanceToCollect / pendingTerms);

      // Generar tabla de amortización con cuota fija para las cuotas pendientes
      const schedule = Array.from({ length: pendingTerms }).map((_, i) => {
        const d = new Date(modBNextDueDate);
        d.setDate(d.getDate() + i * (frequency === 'DIARIO' ? 1 : frequency === 'SEMANAL' ? 7 : frequency === 'QUINCENAL' ? 15 : 30));
        return {
          installmentNumber: i + 1,
          dueDate: d.toISOString().split('T')[0],
          quota: fixedQuota,
          capital: Math.round(fixedQuota * 0.85),
          interest: Math.round(fixedQuota * 0.15),
          balanceRemaining: Math.max(0, balanceToCollect - fixedQuota * (i + 1)),
          status: 'PENDIENTE' as const,
        };
      });

      newLoan = {
        id: loanId,
        code: loanCode,
        clientId: newClient.id,
        amount: modBInitialAmount,
        closingFee: 0,
        netDisbursed: modBInitialAmount,
        rate,
        frequency,
        type: 'FIXED',
        terms: pendingTerms,
        quota: fixedQuota,
        totalWithInterest: modBInitialAmount,
        balance: balanceToCollect,
        capitalBalance: Math.round(balanceToCollect * 0.85),
        interestBalance: Math.round(balanceToCollect * 0.15),
        totalPaid: modBTotalPaid,
        status: balanceToCollect > 0 ? 'ACTIVE' : 'PAID',
        advisorId: 'USR-01',
        advisorName,
        createdDate: nowISO,
        dueDate: schedule[schedule.length - 1]?.dueDate || nowISO,
        contractSigned: true,
        daysOverdue: 0,
        schedule,
        notes: `Saldo al día de hoy DOP ${balanceToCollect}. Préstamo inicial: DOP ${modBInitialAmount}. Pagado acumulado: DOP ${modBTotalPaid}. Cuotas pendientes: ${pendingTerms} de DOP ${fixedQuota}.`,
      };

      if (modBTotalPaid > 0) {
        initialPayments.push({
          id: `PAY-MIG-${Date.now()}`,
          receiptNumber: `REC-MIG-${new Date().getFullYear()}-${Math.floor(Math.random() * 899 + 100)}`,
          loanId: newLoan.id,
          loanCode: newLoan.code,
          clientId: newClient.id,
          clientName: newClient.name,
          amount: modBTotalPaid,
          capitalPaid: Math.round(modBTotalPaid * 0.85),
          interestPaid: Math.round(modBTotalPaid * 0.15),
          lateFeePaid: 0,
          paymentType: 'REGULAR',
          method: 'EFECTIVO',
          date: nowISO,
          time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
          collectorName: advisorName,
          balanceAfter: balanceToCollect,
          notes: `Abono previo documentado al abrir balance inicial migrado en sistema`,
        });
      }
    }

    // Registrar asiento en el Libro Diario
    const journalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: nowISO,
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'CLIENTE',
      entityId: newClient.id,
      entityName: `${newClient.name} (${newLoan.code})`,
      actionType: 'CREACION',
      justification: `[Balance Inicial - ${modalidad === 'MODALIDAD_A' ? 'Ficha Histórica Excepcional' : 'Programación Saldo al Día de Hoy'}] ${justification}`,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Ingreso de cliente ${newClient.name} con saldo inicial activo de DOP ${newLoan.balance}. Total original DOP ${newLoan.amount}, cuota fijada en DOP ${newLoan.quota}.`,
      debitAmount: newLoan.balance,
      creditAmount: newLoan.balance,
    };

    onCompleteOnboarding({
      client: newClient,
      loan: newLoan,
      initialPayments,
      journalEntry,
    });

    confetti({ particleCount: 70, spread: 70 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Entrada de Clientes con Balance Inicial & Cartera Migrada
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Listo para Operar 100%
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Permite continuar cobrando a partir de la realidad contable con ficha histórica o programación de saldo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modalidad Selector Tabs */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setModalidad('MODALIDAD_B')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
              modalidad === 'MODALIDAD_B'
                ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                modalidad === 'MODALIDAD_B' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                Modalidad B: Saldo al Día de Hoy
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300">Recomendada</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Registra el saldo al día de hoy, cuánto pagó, cuotas pendientes y cuota fija para seguir cobrando de inmediato.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModalidad('MODALIDAD_A')}
            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition ${
              modalidad === 'MODALIDAD_A'
                ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                modalidad === 'MODALIDAD_A' ? 'bg-emerald-500 text-white font-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm">Modalidad A: Ficha Histórica Excepcional</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Para cliente actual: carga todas sus operaciones desde el inicio sin constancia formal, usando su ficha o control de balance.
              </p>
            </div>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Section 1: Datos Personales del Cliente */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-amber-400 text-xs flex items-center gap-2">
              <User className="w-4 h-4" /> 1. Ficha del Cliente (Deudor)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  placeholder="Ej. Roberto Sánchez Cabrera"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Cédula Dominicana *</label>
                <input
                  type="text"
                  value={clientCedula}
                  onChange={(e) => setClientCedula(formatCedula(e.target.value))}
                  required
                  placeholder="001-XXXXXXX-X"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Teléfono Móvil / WhatsApp *</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="829-555-1234"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Dirección / Negocio en RD</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Calle Duarte No. 45, Los Mina, SDE"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Ocupación / Actividad</label>
                <input
                  type="text"
                  value={clientOccupation}
                  onChange={(e) => setClientOccupation(e.target.value)}
                  placeholder="Comercio local, Taller, etc."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Garante Solidario / Fiador (Opcional)</label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  placeholder="Nombre del garante si aplica"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Teléfono del Garante</label>
                <input
                  type="text"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  placeholder="809-000-0000"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Configuración según Modalidad */}
          {modalidad === 'MODALIDAD_B' ? (
            /* MODALIDAD B: Saldo al Día de Hoy con Programación de Cuotas Pendientes */
            <div className="p-4 bg-gradient-to-r from-amber-950/20 via-slate-950 to-slate-900 rounded-xl border border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-400 text-xs flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  2. Programación de Saldo al Día de Hoy & Cuotas Pendientes
                </h4>
                <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/20">
                  Cuota Fija por Cantidad Determinada de Pagos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">
                    1. Saldo / Préstamo Inicial (DOP)
                  </label>
                  <input
                    type="number"
                    value={modBInitialAmount}
                    onChange={(e) => setModBInitialAmount(Number(e.target.value) || 0)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">Monto pactado originalmente</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">
                    2. Cuánto ha Pagado a la Fecha (DOP)
                  </label>
                  <input
                    type="number"
                    value={modBTotalPaid}
                    onChange={(e) => {
                      const paid = Number(e.target.value) || 0;
                      setModBTotalPaid(paid);
                      handleModBBalanceChange(Math.max(0, modBInitialAmount - paid));
                    }}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">Total abonado por el cliente</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/50 space-y-1">
                  <label className="text-amber-300 font-bold block text-[11px]">
                    3. Saldo Pendiente al Día de Hoy (DOP) *
                  </label>
                  <input
                    type="number"
                    value={modBCurrentBalance}
                    onChange={(e) => handleModBBalanceChange(Number(e.target.value) || 0)}
                    required
                    className="w-full p-2 bg-slate-950 border border-amber-500 rounded-lg text-amber-300 font-black text-base"
                  />
                  <span className="text-[10px] text-amber-400/80 block">Saldo real actual a cobrar</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">
                    4. Cuotas Pendientes de Pago *
                  </label>
                  <input
                    type="number"
                    value={modBPendingInstallments}
                    onChange={(e) => handleModBInstallmentsChange(Number(e.target.value) || 1)}
                    min={1}
                    max={120}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">Cantidad de pagos restantes</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/50 space-y-1">
                  <label className="text-emerald-300 font-bold block text-[11px]">
                    5. Cuota Fija Periódica (DOP) *
                  </label>
                  <input
                    type="number"
                    value={modBFixedQuota}
                    onChange={(e) => setModBFixedQuota(Number(e.target.value) || 0)}
                    required
                    className="w-full p-2 bg-slate-950 border border-emerald-500 rounded-lg text-emerald-300 font-black text-base"
                  />
                  <span className="text-[10px] text-emerald-400/80 block">Monto exacto a cobrar por cuota</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Frecuencia de Cobro</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-bold text-xs"
                  >
                    <option value="DIARIO">Diario (Lunes a Sábado)</option>
                    <option value="SEMANAL">Semanal</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="MENSUAL">Mensual</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block">Periodicidad de visita</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Próximo Cobro Programado</label>
                  <input
                    type="date"
                    value={modBNextDueDate}
                    onChange={(e) => setModBNextDueDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">Fecha primera cuota</span>
                </div>
              </div>

              {/* Resumen de Programación */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Plan de Cobro Listo para Ruta:</span>
                  <span className="text-slate-200 font-bold">
                    Cobrar {modBPendingInstallments} cuotas fijas de {formatDOP(modBFixedQuota)} ({frequency.toLowerCase()})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Total a Recuperar:</span>
                  <span className="text-amber-400 font-black text-sm">
                    {formatDOP(modBCurrentBalance)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* MODALIDAD A: Carga de Histórico Completo / Ficha de Control Excepcional */
            <div className="p-4 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-slate-900 rounded-xl border border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  2. Carga desde el Inicio de Histórico / Ficha de Control de Balance
                </h4>
                <span className="text-[10px] text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-500/20">
                  Caso Excepcional sin Constancia Previa
                </span>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-[11px] text-emerald-200">
                <Info className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  Esta opción permite registrar a un cliente actual cargando todo su saldo desde el inicio histórico, registrando
                  todas sus operaciones ya anotadas en tarjetas o cuadernos anteriores para que la base de datos quede 100% conciliada.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">No. Ficha / Control Físico</label>
                  <input
                    type="text"
                    value={histControlFichaNumber}
                    onChange={(e) => setHistControlFichaNumber(e.target.value)}
                    placeholder="FICHA-001"
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">Referencia de tarjeta o cuaderno</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Monto Préstamo Inicial</label>
                  <input
                    type="number"
                    value={histOriginalAmount}
                    onChange={(e) => setHistOriginalAmount(Number(e.target.value) || 0)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">Desembolso original</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Fecha Original Desembolso</label>
                  <input
                    type="date"
                    value={histOriginalDate}
                    onChange={(e) => setHistOriginalDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">Apertura del crédito</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Cuotas Totales Pactadas</label>
                  <input
                    type="number"
                    value={histTotalTerms}
                    onChange={(e) => setHistTotalTerms(Number(e.target.value) || 1)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block">Plazo total original</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Pagos ya Registrados en Ficha</label>
                  <input
                    type="number"
                    value={histPaymentsMadeCount}
                    onChange={(e) => setHistPaymentsMadeCount(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">Cantidad de cuotas cobradas</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">Monto Total Cobrado en Ficha</label>
                  <input
                    type="number"
                    value={histTotalPaidAmount}
                    onChange={(e) => {
                      const paid = Number(e.target.value) || 0;
                      setHistTotalPaidAmount(paid);
                      setHistOutstandingBalance(Math.max(0, histOriginalAmount - paid));
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-black text-sm"
                  />
                  <span className="text-[10px] text-slate-500 block">DOP acumulado cobrado</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/50 space-y-1">
                  <label className="text-amber-300 font-bold block text-[11px]">Saldo Pendiente Actual de la Ficha</label>
                  <input
                    type="number"
                    value={histOutstandingBalance}
                    onChange={(e) => setHistOutstandingBalance(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-amber-500 rounded-lg text-amber-300 font-black text-base"
                  />
                  <span className="text-[10px] text-amber-400/80 block">Saldo activo a migrar al sistema</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Justificación Obligatoria para el Asiento de Diario */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-amber-400 text-xs flex items-center gap-2">
              <FileText className="w-4 h-4" /> 3. Asiento Contable en Libro Diario & Justificación Obligatoria
            </h4>

            <div>
              <label className="text-slate-400 block mb-1">
                Detalle / Justificación de la Migración o Ingreso Excepcional *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
                rows={2}
                placeholder="Indique motivo de carga de balance inicial (ej. Migración de cartera de cobranza manual, regularización de balance de cliente antiguo, etc.)"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400 text-[11px]">
              <div>
                <span className="block text-slate-500">Cobrador / Asesor Asignado:</span>
                <input
                  type="text"
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs mt-1"
                />
              </div>

              <div>
                <span className="block text-slate-500">Autorizado por:</span>
                <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-semibold text-xs mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {currentSession.name} ({currentSession.categoryLabel})
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 text-xs transition"
            >
              <CheckCircle className="w-4 h-4 text-slate-950" />
              Ingresar Cliente y Dejar Listo para Cobrar 100%
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
