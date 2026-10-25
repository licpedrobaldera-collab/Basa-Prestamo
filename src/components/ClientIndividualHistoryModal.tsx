import React from 'react';
import { Client, Loan, PaymentTransaction, SystemSettings } from '../types';
import { exportToCSV, formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  User,
  History,
  FileText,
  DollarSign,
  Download,
  Printer,
  X,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface ClientIndividualHistoryModalProps {
  client: Client;
  loans: Loan[];
  payments: PaymentTransaction[];
  settings: SystemSettings;
  onClose: () => void;
  onOpenAmortization: (loan: Loan) => void;
}

export const ClientIndividualHistoryModal: React.FC<ClientIndividualHistoryModalProps> = ({
  client,
  loans,
  payments,
  settings,
  onClose,
  onOpenAmortization,
}) => {
  // Filter records specifically for this client
  const clientLoans = loans.filter((l) => l.clientId === client.id);
  const clientPayments = payments.filter((p) => p.clientId === client.id);

  const totalBorrowed = clientLoans.reduce((acc, l) => acc + l.amount, 0);
  const currentDebt = clientLoans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    .reduce((acc, l) => acc + l.balance, 0);
  const totalRepaid = clientPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleExportExcel = () => {
    const filename = `Expediente_Historico_${client.name.replace(/\s+/g, '_')}_${client.cedula}`;
    const headers = [
      'Código Préstamo',
      'Fecha Desembolso',
      'Modalidad',
      'Monto Original',
      'Cuota Periódica',
      'Balance Actual',
      'Total Pagado',
      'Estado',
    ];

    const rows = clientLoans.map((l) => [
      l.code,
      l.createdDate,
      `${l.frequency} - ${l.type}`,
      l.amount,
      l.quota,
      l.balance,
      l.totalPaid,
      l.status,
    ]);

    exportToCSV(filename, headers, rows);
  };

  const handleDownloadJSON = () => {
    const filename = `EXPEDIENTE_HISTORICO_${client.cedula.replace(/\D/g, '')}_${new Date().toISOString().split('T')[0]}.json`;
    const data = {
      cliente: client,
      prestamos: clientLoans,
      pagos: clientPayments,
      cuentaDesembolso: {
        banco: client.bankName || 'No especificado',
        tipoCuenta: client.bankAccountType || 'AHORROS',
        numeroCuenta: client.bankAccountNumber || 'No especificado',
        titular: client.bankAccountHolder || client.name,
      },
      exportadoEl: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Expediente Histórico Individual del Cliente
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                  {client.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {client.name} • Cédula Electoral: {client.cedula} • Tel: {client.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-amber-500/30"
              title="Descargar base de datos individual del cliente en formato JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar JSON</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Expediente</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs bg-slate-950/40">
          {/* Top Profile Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Histórico Financiado</span>
              <div className="text-base font-black text-slate-200 mt-1">{formatDOP(totalBorrowed)}</div>
              <p className="text-[10px] text-slate-500">{clientLoans.length} préstamos otorgados</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Deuda Activa Pendiente</span>
              <div className="text-base font-black text-amber-400 mt-1">{formatDOP(currentDebt)}</div>
              <p className="text-[10px] text-slate-500">Saldo insoluto vigente</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Pagos Realizados</span>
              <div className="text-base font-black text-emerald-400 mt-1">{formatDOP(totalRepaid)}</div>
              <p className="text-[10px] text-slate-500">{clientPayments.length} recibos confirmados</p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Reputación Crediticia</span>
              <div className="text-sm font-bold text-sky-400 mt-1">
                {client.reputation || 'Cliente Regular Confiable'}
              </div>
              <p className="text-[10px] text-slate-500">Ocupación: {client.occupation}</p>
            </div>
          </div>

          {/* Client Details, Bank Account & Guarantor Card */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-amber-400 text-xs">Datos Personales, Domicilio & Garantes</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Dirección Registrada:</span>
                <span className="text-slate-200 font-semibold">{client.address}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Ingreso Mensual:</span>
                <span className="text-emerald-400 font-bold">{formatDOP(client.monthlyIncome)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Garante Solidario (Cat. 4):</span>
                <span className="text-slate-200 font-semibold">
                  {client.guarantor ? `${client.guarantor} (${client.guarantorCedula || client.guarantorPhone || 'N/A'})` : 'Sin garante'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Co-deudor Solidario (Cat. 5):</span>
                <span className="text-slate-200 font-semibold">
                  {client.coDebtor ? `${client.coDebtor} (${client.coDebtorCedula || client.coDebtorPhone || 'N/A'})` : 'Sin co-deudor'}
                </span>
              </div>
            </div>

            {/* Bank Account for Disbursement */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-sky-400">🏦 Cuenta Bancaria para Desembolso:</span>
                <span className="text-slate-200 font-mono font-bold text-xs">
                  {client.bankName || 'Banco de Reservas'} • Cuenta: {client.bankAccountNumber || 'No registrada aún'} ({client.bankAccountType || 'AHORROS'})
                </span>
              </div>
              {client.bankAccountHolder && (
                <span className="text-[11px] text-slate-400">
                  Titular: <strong className="text-slate-300">{client.bankAccountHolder}</strong>
                </span>
              )}
            </div>
          </div>

          {/* History of Loans Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <History className="w-4 h-4 text-amber-400" />
                Historial Cronológico de Préstamos del Cliente ({clientLoans.length})
              </span>
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Modalidad</th>
                    <th className="p-3">Monto</th>
                    <th className="p-3">Cuota</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Cronograma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {clientLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-bold text-amber-400">{l.code}</td>
                      <td className="p-3 text-slate-300 font-sans">{l.createdDate}</td>
                      <td className="p-3 text-slate-300 font-sans">{l.frequency} ({l.rate}%)</td>
                      <td className="p-3 font-bold text-slate-200">{formatDOP(l.amount)}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatDOP(l.quota)}</td>
                      <td className="p-3 font-bold text-amber-400">{formatDOP(l.balance)}</td>
                      <td className="p-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            l.status === 'PAID'
                              ? 'bg-purple-500/20 text-purple-300'
                              : l.status === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-sans">
                        <button
                          onClick={() => onOpenAmortization(l)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30"
                        >
                          Ver Amortización
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* History of Payments Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Historial de Pagos y Abonos Registrados ({clientPayments.length})
            </span>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Recibo No.</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Préstamo</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Capital</th>
                    <th className="p-3">Interés</th>
                    <th className="p-3">Total Pagado</th>
                    <th className="p-3">Saldo Posterior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {clientPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-bold text-amber-400">{p.receiptNumber}</td>
                      <td className="p-3 text-slate-300 font-sans">{p.date}</td>
                      <td className="p-3 text-slate-300">{p.loanCode}</td>
                      <td className="p-3 text-slate-400 font-sans">{p.paymentType}</td>
                      <td className="p-3 text-slate-300">{formatDOP(p.capitalPaid)}</td>
                      <td className="p-3 text-emerald-400">{formatDOP(p.interestPaid)}</td>
                      <td className="p-3 font-black text-amber-400">{formatDOP(p.amount)}</td>
                      <td className="p-3 text-slate-300">{formatDOP(p.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
