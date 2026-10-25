import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  Search,
  Filter,
  Plus,
  FileText,
  DollarSign,
  User,
  Eye,
  XCircle,
  Building2,
  Mail,
  Share2,
} from 'lucide-react';
import { formatCedula, formatDOP } from '../utils/loanCalculator';

export interface WorkflowLoan {
  id: string;
  clientName: string;
  clientId: string;
  amount: number;
  currency: string;
  termMonths: number;
  rate: number;
  method: string;
  stage: 'PRE_EVALUACION' | 'VERIFICACION_BURÓ' | 'APROBACION_GERENCIAL' | 'DESEMBOLSADO' | 'RECHAZADO';
  logs: { date: string; user: string; text: string }[];
  clientEmail?: string;
  clientPhone?: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  dbSchema: string;
  currency: string;
  status: string;
  balance: number;
}

export const ROLES_PERMISSIONS: Record<
  string,
  { maxStageAdvance: string; canApprove: boolean; label: string }
> = {
  Oficial: { maxStageAdvance: 'VERIFICACION_BURÓ', canApprove: false, label: 'Oficial de Crédito' },
  Supervisor: { maxStageAdvance: 'APROBACION_GERENCIAL', canApprove: false, label: 'Supervisor de Riesgos' },
  Gerente: { maxStageAdvance: 'DESEMBOLSADO', canApprove: true, label: 'Gerente Operativo' },
  Administrador: { maxStageAdvance: 'DESEMBOLSADO', canApprove: true, label: 'Administrador General' },
};

interface LoanWorkflowPipelineProps {
  activeTenant: TenantInfo;
  currentRole: string;
  loans: WorkflowLoan[];
  onUpdateLoans: (updater: (prev: WorkflowLoan[]) => WorkflowLoan[]) => void;
  onOpenGmailDraft?: (draft: { clientName: string; recipientEmail?: string; subject: string; bodyHtml: string }) => void;
}

export const LoanWorkflowPipeline: React.FC<LoanWorkflowPipelineProps> = ({
  activeTenant,
  currentRole,
  loans,
  onUpdateLoans,
  onOpenGmailDraft,
}) => {
  const [selectedLoanModal, setSelectedLoanModal] = useState<WorkflowLoan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);

  // New Loan Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newAmount, setNewAmount] = useState('150000');
  const [newTerm, setNewTerm] = useState('12');
  const [newRate, setNewRate] = useState('2.5');
  const [newMethod, setNewMethod] = useState('Francés');
  const [newEmail, setNewEmail] = useState('');

  const roleProps = ROLES_PERMISSIONS[currentRole] || ROLES_PERMISSIONS['Gerente'];

  const filteredLoans = loans.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.clientName.toLowerCase().includes(term) ||
      l.clientId.includes(term) ||
      l.id.toLowerCase().includes(term)
    );
  });

  const handleAdvanceStage = (loanId: string, currentStage: string) => {
    let nextStage: WorkflowLoan['stage'] = 'PRE_EVALUACION';

    if (currentStage === 'PRE_EVALUACION') {
      nextStage = 'VERIFICACION_BURÓ';
    } else if (currentStage === 'VERIFICACION_BURÓ') {
      if (currentRole === 'Oficial') {
        alert(
          `Acceso restringido: El rol ${currentRole} no tiene autorización para pasar solicitudes a Aprobación Gerencial. Requiere nivel Supervisor o Gerente.`
        );
        return;
      }
      nextStage = 'APROBACION_GERENCIAL';
    } else if (currentStage === 'APROBACION_GERENCIAL') {
      if (!roleProps.canApprove) {
        alert(
          `Acceso denegado: El rol ${currentRole} no cuenta con permisos para autorizar desembolsos definitivos. Se requiere Gerente o Administrador.`
        );
        return;
      }
      nextStage = 'DESEMBOLSADO';
    }

    onUpdateLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          return {
            ...l,
            stage: nextStage,
            logs: [
              ...l.logs,
              {
                date: new Date().toISOString().split('T')[0],
                user: currentRole,
                text: `Transición autorizada de [${currentStage}] a [${nextStage}]`,
              },
            ],
          };
        }
        return l;
      })
    );

    if (selectedLoanModal && selectedLoanModal.id === loanId) {
      setSelectedLoanModal((prev) => (prev ? { ...prev, stage: nextStage } : null));
    }
  };

  const handleRejectLoan = (loanId: string) => {
    onUpdateLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          return {
            ...l,
            stage: 'RECHAZADO',
            logs: [
              ...l.logs,
              {
                date: new Date().toISOString().split('T')[0],
                user: currentRole,
                text: 'Solicitud evaluada y rechazada.',
              },
            ],
          };
        }
        return l;
      })
    );
    setSelectedLoanModal(null);
  };

  const handleCreateNewLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientId.trim()) {
      alert('Por favor complete el nombre y la cédula del solicitante');
      return;
    }

    const newLoanObj: WorkflowLoan = {
      id: `L-${activeTenant.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      clientName: newClientName,
      clientId: newClientId,
      amount: parseFloat(newAmount) || 100000,
      currency: activeTenant.currency,
      termMonths: parseInt(newTerm) || 12,
      rate: parseFloat(newRate) || 2.5,
      method: newMethod,
      stage: 'PRE_EVALUACION',
      clientEmail: newEmail,
      logs: [
        {
          date: new Date().toISOString().split('T')[0],
          user: currentRole,
          text: `Solicitud registrada en el esquema ${activeTenant.dbSchema}`,
        },
      ],
    };

    onUpdateLoans((prev) => [newLoanObj, ...prev]);
    setShowNewLoanModal(false);
    setNewClientName('');
    setNewClientId('');
    setNewEmail('');
  };

  const STAGES_CONFIG: {
    key: WorkflowLoan['stage'];
    title: string;
    badgeColor: string;
    borderColor: string;
    icon: any;
  }[] = [
    {
      key: 'PRE_EVALUACION',
      title: '1. Pre-Evaluación',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      borderColor: 'border-amber-500/30',
      icon: Clock,
    },
    {
      key: 'VERIFICACION_BURÓ',
      title: '2. Buró & Riesgo',
      badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      borderColor: 'border-blue-500/30',
      icon: Shield,
    },
    {
      key: 'APROBACION_GERENCIAL',
      title: '3. Aprobación Gerencial',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      borderColor: 'border-purple-500/30',
      icon: AlertCircle,
    },
    {
      key: 'DESEMBOLSADO',
      title: '4. Desembolsados Activos',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      borderColor: 'border-emerald-500/30',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Workflow Maestro de Créditos & Validaciones RBAC
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {activeTenant.dbSchema}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aislamiento estricto por inquilino ({activeTenant.name}) • Nivel de Aprobación Activo:{' '}
                <strong className="text-amber-400">{roleProps.label}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente, cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowNewLoanModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Solicitud Online
          </button>
        </div>
      </div>

      {/* 4 Stages Pipeline Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES_CONFIG.map(({ key, title, badgeColor, borderColor, icon: StageIcon }) => {
          const stageLoans = filteredLoans.filter((l) => l.stage === key);

          return (
            <div
              key={key}
              className={`flex flex-col bg-slate-900/60 rounded-2xl border ${borderColor} overflow-hidden min-h-[500px]`}
            >
              {/* Column Header */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StageIcon className="w-4 h-4 text-slate-300" />
                  <span className="font-bold text-xs text-white">{title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                  {stageLoans.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {stageLoans.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-600 text-xs italic">
                    <Clock className="w-6 h-6 mb-1 opacity-40" />
                    Sin solicitudes en esta fase
                  </div>
                ) : (
                  stageLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 hover:border-slate-700 transition shadow space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">
                          {loan.id}
                        </span>
                        <span className="text-xs font-extrabold text-amber-400">
                          {loan.currency} ${loan.amount.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{loan.clientName}</h4>
                        <p className="text-[11px] text-slate-400">ID: {loan.clientId}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>
                          {loan.termMonths} Meses • {loan.rate}%
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-medium">
                          {loan.method}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLoanModal(loan)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Auditoría
                        </button>

                        <div className="flex items-center gap-1.5">
                          {onOpenGmailDraft && loan.clientEmail && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenGmailDraft({
                                  clientName: loan.clientName,
                                  recipientEmail: loan.clientEmail,
                                  subject: `Actualización de Estado: Préstamo ${loan.id} (${title})`,
                                  bodyHtml: `<p>Estimado(a) ${loan.clientName}, su préstamo ${loan.id} se encuentra actualmente en fase: <strong>${title}</strong>.</p>`,
                                })
                              }
                              title="Notificar por Gmail"
                              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition"
                            >
                              <Mail className="w-3 h-3" />
                            </button>
                          )}

                          {key !== 'DESEMBOLSADO' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(loan.id, loan.stage)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow cursor-pointer"
                            >
                              Avanzar
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Online Application Form */}
      {showNewLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Registrar Solicitud en Pipeline ({activeTenant.dbSchema})
              </h3>
              <button
                onClick={() => setShowNewLoanModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewLoan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Nombre Completo del Solicitante
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez Rosario"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Cédula / RNC Dominicano
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="001-0000000-0"
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Correo Electrónico (Gmail)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Monto ({activeTenant.currency})
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Plazo (Meses)</label>
                  <input
                    type="number"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tasa Mensual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Estructura / Método</label>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="Francés">Francés (Cuota Fija)</option>
                  <option value="Alemán">Alemán (Capital Constante)</option>
                  <option value="Insoluto">Sobre Saldo Insoluto</option>
                  <option value="Fijo">Fijo Simple</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30"
                >
                  Registrar en Pre-Evaluación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Loan Traceability & Audit Logs */}
      {selectedLoanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  Trazabilidad & Auditoría: {selectedLoanModal.id}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Esquema Maestro: <strong>{activeTenant.dbSchema}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedLoanModal(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block">Titular:</span>
                <span className="font-bold text-white">{selectedLoanModal.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Cédula:</span>
                <span className="font-mono text-slate-200">{selectedLoanModal.clientId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monto Solicitado:</span>
                <span className="font-bold text-amber-400">
                  {selectedLoanModal.currency} ${selectedLoanModal.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Fase Actual:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                  {selectedLoanModal.stage}
                </span>
              </div>
            </div>

            {/* Audit Log Timeline */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Historial de Asientos & Transiciones (Auditoría SQL)
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {selectedLoanModal.logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs flex items-start gap-2"
                  >
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                      {log.date}
                    </span>
                    <div>
                      <span className="font-semibold text-indigo-400 mr-1.5">[{log.user}]</span>
                      <span className="text-slate-300">{log.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleRejectLoan(selectedLoanModal.id)}
                className="px-4 py-2 bg-rose-950/40 border border-rose-900/60 text-rose-400 hover:bg-rose-900 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Rechazar Crédito
              </button>

              <div className="flex gap-2">
                {selectedLoanModal.stage !== 'DESEMBOLSADO' && (
                  <button
                    type="button"
                    onClick={() => handleAdvanceStage(selectedLoanModal.id, selectedLoanModal.stage)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
                  >
                    Avanzar a Siguiente Fase
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLoanModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
