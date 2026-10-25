import React, { useState } from 'react';
import { Client, ExtraCharge, Loan, PaymentTransaction, PaymentVoucherVerification } from '../types';
import { exportToCSV, formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  Building,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  DollarSign,
  X,
  FileText,
  AlertTriangle,
  Download,
  Filter,
  Eye,
  Camera,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface VoucherVerificationModalProps {
  vouchers: PaymentVoucherVerification[];
  loans: Loan[];
  clients: Client[];
  extraCharges?: ExtraCharge[];
  reviewerName: string;
  onClose: () => void;
  onSubmitNewVoucher: (newVoucher: PaymentVoucherVerification) => void;
  onApproveVoucher: (voucher: PaymentVoucherVerification, deductionDetails: {
    capitalPaid: number;
    interestPaid: number;
    lateFeePaid: number;
    extraChargesPaid: number;
    adminFeePaid: number;
    totalAmount: number;
  }) => void;
  onRejectVoucher: (voucherId: string, reason: string) => void;
}

export const VoucherVerificationModal: React.FC<VoucherVerificationModalProps> = ({
  vouchers,
  loans,
  clients,
  extraCharges = [],
  reviewerName,
  onClose,
  onSubmitNewVoucher,
  onApproveVoucher,
  onRejectVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<'VERIFY_QUEUE' | 'NEW_VOUCHER'>('VERIFY_QUEUE');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE_VERIFICACION' | 'APROBADO' | 'RECHAZADO'>('PENDIENTE_VERIFICACION');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = useState<PaymentVoucherVerification | null>(null);
  const [rejectingVoucherId, setRejectingVoucherId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Form State for Uploading New Voucher
  const [newLoanId, setNewLoanId] = useState<string>(loans[0]?.id || '');
  const [newBankName, setNewBankName] = useState('Banco de Reservas (Banreservas)');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newReferenceNumber, setNewReferenceNumber] = useState('');
  const [newAmountPaid, setNewAmountPaid] = useState<number>(loans[0]?.quota || 0);
  const [newProofPhotoUrl, setNewProofPhotoUrl] = useState<string>('');
  const [newNotes, setNewNotes] = useState('');

  // When changing loan in form, auto-fill client and quota
  const handleLoanSelectChange = (loanId: string) => {
    setNewLoanId(loanId);
    const selectedLoan = loans.find((l) => l.id === loanId);
    if (selectedLoan) {
      setNewAmountPaid(selectedLoan.quota);
      const client = clients.find((c) => c.id === selectedLoan.clientId);
      if (client?.bankAccountNumber) {
        setNewAccountNumber(client.bankAccountNumber);
      }
      if (client?.bankName) {
        setNewBankName(client.bankName);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewProofPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit client upload voucher
  const handleSubmitNewVoucherForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoanId || newAmountPaid <= 0 || !newReferenceNumber) {
      alert('Por favor complete el préstamo, monto depositado y número de referencia.');
      return;
    }

    const loan = loans.find((l) => l.id === newLoanId);
    const client = clients.find((c) => c.id === loan?.clientId);

    const newVoucher: PaymentVoucherVerification = {
      id: `VOUCH-${Date.now()}`,
      receiptNumber: `REC-DEP-${Math.floor(1000 + Math.random() * 9000)}`,
      loanId: newLoanId,
      loanCode: loan?.code || 'PR-2026',
      clientId: client?.id || '',
      clientName: client?.name || 'Cliente Deudor',
      clientCedula: client?.cedula || '',
      bankName: newBankName,
      accountNumber: newAccountNumber,
      referenceNumber: newReferenceNumber,
      amountPaid: Number(newAmountPaid),
      submittedDate: new Date().toISOString().split('T')[0],
      submittedTime: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      proofPhotoUrl: newProofPhotoUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
      status: 'PENDIENTE_VERIFICACION',
      notes: newNotes,
    };

    onSubmitNewVoucher(newVoucher);
    alert('¡Comprobante de depósito cargado exitosamente! Pasará a verificación de banco por el cobrador/administrador.');
    setActiveTab('VERIFY_QUEUE');
    setStatusFilter('PENDIENTE_VERIFICACION');
  };

  // Calculate detailed deduction breakdown when approving voucher
  const calculateDeduction = (voucher: PaymentVoucherVerification) => {
    const loan = loans.find((l) => l.id === voucher.loanId);
    const amount = voucher.amountPaid;

    if (!loan) {
      return {
        capitalPaid: Math.round(amount * 0.7),
        interestPaid: Math.round(amount * 0.3),
        lateFeePaid: 0,
        extraChargesPaid: 0,
        adminFeePaid: 0,
        totalAmount: amount,
      };
    }

    let remaining = amount;
    let lateFeePaid = 0;
    let extraChargesPaid = 0;
    let interestPaid = 0;
    let capitalPaid = 0;

    // 1. First deduct late fees (mora) if overdue
    if ((loan.daysOverdue || 0) > 0) {
      const estimatedMora = (loan.daysOverdue || 0) * 100;
      lateFeePaid = Math.min(remaining, estimatedMora);
      remaining -= lateFeePaid;
    }

    // 2. Next check pending extra charges on this loan
    const pendingCharges = extraCharges
      .filter((c) => c.loanId === loan.id && c.status === 'PENDIENTE')
      .reduce((sum, c) => sum + c.amount, 0);

    if (pendingCharges > 0 && remaining > 0) {
      extraChargesPaid = Math.min(remaining, pendingCharges);
      remaining -= extraChargesPaid;
    }

    // 3. Next deduct regular interest and capital
    if (loan.type === 'INTEREST_ONLY') {
      interestPaid = Math.min(remaining, loan.quota);
      remaining -= interestPaid;
      capitalPaid = remaining;
    } else {
      const ratio = loan.totalWithInterest > 0 ? loan.amount / loan.totalWithInterest : 0.8;
      const expectedInterest = Math.round(loan.quota * (1 - ratio));
      interestPaid = Math.min(remaining, expectedInterest);
      remaining -= interestPaid;
      capitalPaid = remaining;
    }

    return {
      capitalPaid,
      interestPaid,
      lateFeePaid,
      extraChargesPaid,
      adminFeePaid: 0,
      totalAmount: amount,
    };
  };

  const handleApproveClick = (voucher: PaymentVoucherVerification) => {
    const deductions = calculateDeduction(voucher);
    const confirmMsg =
      `¿Confirmar que el depósito de ${formatDOP(voucher.amountPaid)} se encuentra en el banco?\n\n` +
      `Descuento a aplicar al préstamo ${voucher.loanCode}:\n` +
      `• Capital: ${formatDOP(deductions.capitalPaid)}\n` +
      `• Interés: ${formatDOP(deductions.interestPaid)}\n` +
      `• Mora: ${formatDOP(deductions.lateFeePaid)}\n` +
      `• Cargos Extras / Notaría / GPS: ${formatDOP(deductions.extraChargesPaid)}\n\n` +
      `El balance del préstamo y la tabla de amortización se actualizarán automáticamente.`;

    if (window.confirm(confirmMsg)) {
      onApproveVoucher(voucher, deductions);
      setSelectedVoucherForDetail(null);
    }
  };

  const handleConfirmReject = (voucherId: string) => {
    if (!rejectionReasonText) {
      alert('Por favor ingrese el motivo del rechazo del comprobante.');
      return;
    }
    onRejectVoucher(voucherId, rejectionReasonText);
    setRejectingVoucherId(null);
    setRejectionReasonText('');
    setSelectedVoucherForDetail(null);
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = v.clientName.toLowerCase().includes(term);
      const matchCedula = v.clientCedula.includes(term);
      const matchRef = v.referenceNumber.toLowerCase().includes(term);
      const matchCode = v.loanCode.toLowerCase().includes(term);
      const matchBank = v.bankName.toLowerCase().includes(term);
      return matchName || matchCedula || matchRef || matchCode || matchBank;
    }
    return true;
  });

  const pendingCount = vouchers.filter((v) => v.status === 'PENDIENTE_VERIFICACION').length;

  const handleExportExcel = () => {
    const headers = [
      'No. Recibo',
      'Código Préstamo',
      'Cliente',
      'Cédula',
      'Banco',
      'Referencia Bancaria',
      'Monto Depositado DOP',
      'Fecha',
      'Hora',
      'Estado',
      'Verificado Por',
    ];
    const rows = vouchers.map((v) => [
      v.receiptNumber,
      v.loanCode,
      v.clientName,
      v.clientCedula,
      v.bankName,
      v.referenceNumber,
      v.amountPaid,
      v.submittedDate,
      v.submittedTime,
      v.status,
      v.reviewedBy || 'N/A',
    ]);
    exportToCSV(`COMPROBANTES_BANCARIOS_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Verificación de Depósitos Bancarios & Comprobantes en Línea
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                    {pendingCount} Pendiente{pendingCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                El cliente carga el comprobante de pago; el cobrador o admin verifica los fondos en el banco y descuenta capital, interés, moras y gastos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 px-4 pt-3 border-b border-slate-800 gap-2 font-bold text-xs">
          <button
            onClick={() => setActiveTab('VERIFY_QUEUE')}
            className={`py-2 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'VERIFY_QUEUE'
                ? 'border-sky-500 text-sky-400 bg-sky-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cola de Verificación Bancaria</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('NEW_VOUCHER')}
            className={`py-2 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'NEW_VOUCHER'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Cargar Nuevo Comprobante / Recibo</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs bg-slate-950/40">
          {/* TAB 1: COLA DE VERIFICACIÓN */}
          {activeTab === 'VERIFY_QUEUE' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-bold mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Estado:
                  </span>
                  <button
                    onClick={() => setStatusFilter('PENDIENTE_VERIFICACION')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'PENDIENTE_VERIFICACION'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pendientes ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('APROBADO')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'APROBADO'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Aprobados ({vouchers.filter((v) => v.status === 'APROBADO').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('RECHAZADO')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'RECHAZADO'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Rechazados ({vouchers.filter((v) => v.status === 'RECHAZADO').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({vouchers.length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cliente, banco, referencia..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Vouchers Grid / List */}
              {filteredVouchers.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No se encontraron comprobantes con el filtro seleccionado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredVouchers.map((v) => {
                    const loan = loans.find((l) => l.id === v.loanId);
                    const deduction = calculateDeduction(v);

                    return (
                      <div
                        key={v.id}
                        className={`p-4 bg-slate-900/90 rounded-2xl border transition space-y-3 shadow-lg ${
                          v.status === 'PENDIENTE_VERIFICACION'
                            ? 'border-amber-500/40 hover:border-amber-500'
                            : v.status === 'APROBADO'
                            ? 'border-emerald-500/30'
                            : 'border-rose-500/30'
                        }`}
                      >
                        {/* Top Info */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{v.clientName}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                                {v.loanCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Cédula: {v.clientCedula} • Recibo: {v.receiptNumber}
                            </div>
                          </div>

                          <div>
                            {v.status === 'PENDIENTE_VERIFICACION' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Por Verificar
                              </span>
                            )}
                            {v.status === 'APROBADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Aprobado
                              </span>
                            )}
                            {v.status === 'RECHAZADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rechazado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount & Bank Details */}
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">Monto Reportado:</span>
                            <div className="text-base font-black text-amber-400">{formatDOP(v.amountPaid)}</div>
                            <span className="text-[10px] text-slate-400">
                              {v.submittedDate} a las {v.submittedTime}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">Entidad Bancaria:</span>
                            <div className="font-bold text-slate-200">{v.bankName}</div>
                            <div className="text-[10px] font-mono text-sky-400">
                              Ref: {v.referenceNumber}
                            </div>
                          </div>
                        </div>

                        {/* Breakdown preview of deduction */}
                        {v.status === 'PENDIENTE_VERIFICACION' && (
                          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[10px] space-y-1">
                            <span className="text-slate-400 font-bold block">
                              📊 Aplicación de Descuento Prevista al Aprobar:
                            </span>
                            <div className="flex justify-between text-slate-300 font-mono">
                              <span>Capital: {formatDOP(deduction.capitalPaid)}</span>
                              <span>Interés: {formatDOP(deduction.interestPaid)}</span>
                              {deduction.lateFeePaid > 0 && (
                                <span className="text-rose-400">Mora: {formatDOP(deduction.lateFeePaid)}</span>
                              )}
                              {deduction.extraChargesPaid > 0 && (
                                <span className="text-purple-400">Cargos Extra: {formatDOP(deduction.extraChargesPaid)}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes or Rejection Reason */}
                        {v.notes && (
                          <div className="text-[10px] text-slate-400 bg-slate-950/40 p-2 rounded-lg">
                            <span className="font-bold text-slate-300">Nota del Cliente:</span> {v.notes}
                          </div>
                        )}

                        {v.status === 'RECHAZADO' && v.rejectionReason && (
                          <div className="text-[10px] text-rose-300 bg-rose-950/30 border border-rose-900/40 p-2 rounded-lg">
                            <span className="font-bold">Motivo del Rechazo:</span> {v.rejectionReason}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                          <button
                            onClick={() => setSelectedVoucherForDetail(v)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>Ver Comprobante</span>
                          </button>

                          {v.status === 'PENDIENTE_VERIFICACION' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRejectingVoucherId(v.id)}
                                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl font-bold transition"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleApproveClick(v)}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold transition shadow flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Aprobar Pago</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CARGAR NUEVO COMPROBANTE */}
          {activeTab === 'NEW_VOUCHER' && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-2xl mx-auto space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Carga de Evidencia / Recibo de Pago por Depósito o Transferencia
                </h4>
                <p className="text-[11px] text-slate-400">
                  Seleccione el préstamo, introduzca la referencia bancaria del depósito y adjunte la foto del volante o comprobante digital.
                </p>
              </div>

              <form onSubmit={handleSubmitNewVoucherForm} className="space-y-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Seleccionar Préstamo del Cliente *</label>
                  <select
                    value={newLoanId}
                    onChange={(e) => handleLoanSelectChange(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium"
                  >
                    {loans.map((l) => {
                      const client = clients.find((c) => c.id === l.clientId);
                      return (
                        <option key={l.id} value={l.id}>
                          {l.code} - {client?.name || 'Cliente'} (Cuota: {formatDOP(l.quota)} • Saldo: {formatDOP(l.balance)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Banco Donde Depositó *</label>
                    <select
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      required
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    >
                      <option value="Banco de Reservas (Banreservas)">Banco de Reservas (Banreservas)</option>
                      <option value="Banco Popular Dominicano">Banco Popular Dominicano</option>
                      <option value="Banco BHD">Banco BHD</option>
                      <option value="Banco Santa Cruz">Banco Santa Cruz</option>
                      <option value="Asociación Popular de Ahorros y Préstamos (APAP)">Asociación Popular (APAP)</option>
                      <option value="Asociación Cibao de Ahorros y Préstamos (ACAP)">Asociación Cibao (ACAP)</option>
                      <option value="Banco Promerica">Banco Promerica</option>
                      <option value="Scotiabank República Dominicana">Scotiabank RD</option>
                      <option value="Depósito en Efectivo Directo en Oficina">Depósito en Efectivo en Oficina</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Número de Cuenta Destino</label>
                    <input
                      type="text"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value)}
                      placeholder="Ej. 960-238491-0"
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Monto Depositado (DOP) *</label>
                    <input
                      type="number"
                      value={newAmountPaid}
                      onChange={(e) => setNewAmountPaid(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-black text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Número de Confirmación / Referencia *</label>
                    <input
                      type="text"
                      value={newReferenceNumber}
                      onChange={(e) => setNewReferenceNumber(e.target.value)}
                      required
                      placeholder="Ej. TRANSF-982348 o Volante 8821"
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Upload voucher receipt */}
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Foto o Captura del Volante / Comprobante</label>
                  <div className="border border-dashed border-slate-700 rounded-xl p-3 text-center bg-slate-950/60 hover:border-amber-500/50 transition">
                    <label className="cursor-pointer block">
                      {newProofPhotoUrl ? (
                        <div className="space-y-2">
                          <img
                            src={newProofPhotoUrl}
                            alt="Comprobante"
                            className="h-32 mx-auto object-contain rounded-lg border border-slate-800"
                          />
                          <span className="text-[11px] text-amber-400 font-bold block">
                            Haga clic para cambiar imagen
                          </span>
                        </div>
                      ) : (
                        <div className="py-4 text-slate-400">
                          <Camera className="w-8 h-8 mx-auto mb-1 text-slate-500" />
                          <span className="font-semibold block text-slate-300">
                            Subir imagen del recibo o captura bancaria
                          </span>
                          <span className="text-[10px] text-slate-500">JPG, PNG o comprobante digital</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Notas o Detalle Adicional</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    placeholder="Ej. Cuota correspondiente al 15 de Octubre más abono extraordinario..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('VERIFY_QUEUE')}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow"
                  >
                    Cargar y Enviar a Verificación
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL / PREVIEW MODAL */}
      {selectedVoucherForDetail && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-400" />
                  Comprobante Bancario: {selectedVoucherForDetail.receiptNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedVoucherForDetail.clientName} • Ref: {selectedVoucherForDetail.referenceNumber}
                </p>
              </div>
              <button onClick={() => setSelectedVoucherForDetail(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proof image */}
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-center">
              <img
                src={selectedVoucherForDetail.proofPhotoUrl}
                alt="Comprobante Bancario"
                className="max-h-60 object-contain rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Banco:</span>
                <div className="font-bold text-slate-200">{selectedVoucherForDetail.bankName}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Referencia:</span>
                <div className="font-mono font-bold text-amber-400">{selectedVoucherForDetail.referenceNumber}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Monto:</span>
                <div className="text-sm font-black text-emerald-400">{formatDOP(selectedVoucherForDetail.amountPaid)}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Fecha / Hora:</span>
                <div className="text-slate-300">
                  {selectedVoucherForDetail.submittedDate} {selectedVoucherForDetail.submittedTime}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedVoucherForDetail(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
              >
                Cerrar
              </button>
              {selectedVoucherForDetail.status === 'PENDIENTE_VERIFICACION' && (
                <>
                  <button
                    onClick={() => {
                      setRejectingVoucherId(selectedVoucherForDetail.id);
                    }}
                    className="px-3 py-1.5 bg-rose-950/40 text-rose-300 border border-rose-800/40 rounded-xl font-bold"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApproveClick(selectedVoucherForDetail)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                  >
                    Aprobar & Descontar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingVoucherId && (
        <div className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-rose-700/40 rounded-2xl w-full max-w-md p-5 space-y-3 text-xs shadow-2xl">
            <h4 className="font-bold text-rose-400 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rechazar Comprobante Bancario
            </h4>
            <p className="text-[11px] text-slate-400">
              Indique el motivo por el cual no se pudo validar este pago (ej. fondos no reflejados en cuenta, duplicado, etc.):
            </p>

            <textarea
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              required
              rows={3}
              placeholder="Ej. El depósito no aparece en el estado de cuenta bancario a la fecha de hoy..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingVoucherId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingVoucherId)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
