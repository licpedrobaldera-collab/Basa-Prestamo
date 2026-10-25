import React, { useState } from 'react';
import { AuthSession, Client, CompanyTenant, JournalEntry, SecretPasswordVaultRecord, SystemSettings, SystemUser } from '../types';
import {
  X,
  ShieldAlert,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Download,
  AlertTriangle,
  UserCheck,
  Building,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  History,
  FileText,
} from 'lucide-react';
import { exportToCSV } from '../utils/loanCalculator';
import confetti from 'canvas-confetti';

interface SecretPasswordVaultModalProps {
  isOpen: boolean;
  currentSession: AuthSession;
  settings: SystemSettings;
  users: SystemUser[];
  companies: CompanyTenant[];
  clients: Client[];
  secretRecords: SecretPasswordVaultRecord[];
  onClose: () => void;
  onUpdateUserPassword: (params: {
    userId: string;
    newPassword: string;
    reason: string;
  }) => void;
  onUpdateCompanyPassword: (params: {
    companyId: string;
    newPassword: string;
    reason: string;
  }) => void;
  onUpdateClientPassword: (params: {
    clientId: string;
    newPassword: string;
    reason: string;
  }) => void;
  onUnlockAccount: (params: {
    accountType: 'USER' | 'COMPANY' | 'CLIENT';
    id: string;
    newPassword?: string;
    justification: string;
  }) => void;
}

export const SecretPasswordVaultModal: React.FC<SecretPasswordVaultModalProps> = ({
  isOpen,
  currentSession,
  settings,
  users,
  companies,
  clients,
  secretRecords,
  onClose,
  onUpdateUserPassword,
  onUpdateCompanyPassword,
  onUpdateClientPassword,
  onUnlockAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'CURRENT_CREDENTIALS' | 'AUDIT_HISTORY'>('CURRENT_CREDENTIALS');

  // Modal para reasignar clave y desbloquear
  const [selectedTarget, setSelectedTarget] = useState<{
    accountType: 'USER' | 'COMPANY' | 'CLIENT';
    id: string;
    name: string;
    identifier: string;
    role: string;
    isLocked?: boolean;
    currentPassword?: string;
  } | null>(null);

  const [newAssignedPassword, setNewAssignedPassword] = useState('');
  const [reassignReason, setReassignReason] = useState(
    'Reasignación de clave por administrador y desbloqueo de cuenta tras 3 intentos fallidos'
  );

  if (!isOpen) return null;

  // Verificación estricta de seguridad: Solo Administrador (Categoría 1) o Pedro Baldera
  const isAdmin =
    currentSession.category === 1 ||
    currentSession.identifier.replace(/\D/g, '') === (settings.adminCedula || '001-1492817-3').replace(/\D/g, '') ||
    currentSession.name.toLowerCase().includes('baldera');

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Acceso Denegado - Área Ultra Secreta</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            El <strong>Archivo Histórico Secreto de Claves</strong> está restringido exclusivamente para el{' '}
            <span className="text-amber-400 font-bold">Administrador Pedro Baldera</span> o el desarrollador raíz del sistema.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg transition"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  // Lista unificada de todas las credenciales actuales del sistema
  const allCurrentAccounts = [
    // Administrador Master
    {
      accountType: 'USER' as const,
      id: 'USR-MASTER',
      name: `${settings.technicalSupportName} (Administrador Full)`,
      identifier: settings.adminCedula || '001-1492817-3',
      role: 'ADMINISTRADOR GENERAL',
      roleColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      password: settings.adminPassword || 'BalderaAdmin2026*',
      failedAttempts: 0,
      isLocked: false,
    },
    // Usuarios / Cobradores / Gerentes
    ...users.map((u) => ({
      accountType: 'USER' as const,
      id: u.id,
      name: u.name,
      identifier: u.cedula || u.id,
      role: u.role === 'GERENTE' ? 'GERENTE / PROPIETARIO' : u.role === 'COBRADOR' ? 'COBRADOR DE CALLE' : u.role,
      roleColor:
        u.role === 'GERENTE'
          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
          : u.role === 'COBRADOR'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          : 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      password: u.password || '123456',
      failedAttempts: u.failedAttempts || 0,
      isLocked: !!u.isLocked,
    })),
    // Empresas / Prestamistas
    ...companies.map((c) => ({
      accountType: 'COMPANY' as const,
      id: c.id,
      name: `${c.name} (${c.ownerName})`,
      identifier: c.rncOrCedula,
      role: 'GERENTE / PROPIETARIO (RNC)',
      roleColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      password: c.password || '123456',
      failedAttempts: c.failedAttempts || 0,
      isLocked: !!c.isLocked,
    })),
    // Clientes Deudores
    ...clients.map((cli) => ({
      accountType: 'CLIENT' as const,
      id: cli.id,
      name: cli.name,
      identifier: cli.cedula,
      role: 'CLIENTE DEUDOR',
      roleColor: 'bg-slate-700/50 text-slate-300 border-slate-600',
      password: cli.password || 'Cliente2026*',
      failedAttempts: cli.failedAttempts || 0,
      isLocked: !!cli.isLocked,
    })),
  ];

  const filteredAccounts = allCurrentAccounts.filter((acc) => {
    const q = searchTerm.toLowerCase();
    return (
      acc.name.toLowerCase().includes(q) ||
      acc.identifier.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q)
    );
  });

  const filteredHistory = secretRecords.filter((rec) => {
    const q = searchTerm.toLowerCase();
    return (
      rec.userName.toLowerCase().includes(q) ||
      rec.identifier.toLowerCase().includes(q) ||
      rec.userRole.toLowerCase().includes(q) ||
      rec.action.toLowerCase().includes(q)
    );
  });

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExecuteReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || !newAssignedPassword.trim()) return;

    if (selectedTarget.accountType === 'USER') {
      onUpdateUserPassword({
        userId: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        reason: reassignReason,
      });
      onUnlockAccount({
        accountType: 'USER',
        id: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        justification: reassignReason,
      });
    } else if (selectedTarget.accountType === 'COMPANY') {
      onUpdateCompanyPassword({
        companyId: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        reason: reassignReason,
      });
      onUnlockAccount({
        accountType: 'COMPANY',
        id: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        justification: reassignReason,
      });
    } else if (selectedTarget.accountType === 'CLIENT') {
      onUpdateClientPassword({
        clientId: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        reason: reassignReason,
      });
      onUnlockAccount({
        accountType: 'CLIENT',
        id: selectedTarget.id,
        newPassword: newAssignedPassword.trim(),
        justification: reassignReason,
      });
    }

    confetti({ particleCount: 50 });
    alert(`¡Clave reasignada con éxito para "${selectedTarget.name}"! La cuenta ha sido desbloqueada.`);
    setSelectedTarget(null);
    setNewAssignedPassword('');
  };

  const handleExportSecretAudit = () => {
    const filename = `Archivo_Historico_Secreto_Claves_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'ID Registro',
      'Fecha / Hora',
      'Usuario',
      'Cédula / RNC',
      'Rol',
      'Clave Secreta Registrada',
      'Acción',
      'Autorizado Por',
      'Notas / Justificación',
    ];

    const rows = secretRecords.map((r) => [
      r.id,
      r.changedAt,
      r.userName,
      r.identifier,
      r.userRole,
      r.secretPassword,
      r.action,
      r.changedBy,
      r.notes || '',
    ]);

    exportToCSV(filename, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">
                  Archivo Histórico Secreto de Claves & Control de Credenciales
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  CONFIDENCIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Acceso exclusivo: Administrador Pedro Baldera. Control de intentos fallidos, bloqueo tras 3 intentos y reasignación de claves.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Subtabs */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CURRENT_CREDENTIALS')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                activeTab === 'CURRENT_CREDENTIALS'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Credenciales Activas & Estado Bloqueo ({allCurrentAccounts.length})
            </button>

            <button
              onClick={() => setActiveTab('AUDIT_HISTORY')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                activeTab === 'AUDIT_HISTORY'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Registro Histórico Secreto ({secretRecords.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cédula, RNC o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 w-56 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => setShowAllPasswords(!showAllPasswords)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl border border-amber-500/30 font-bold flex items-center gap-1.5 transition text-[11px]"
            >
              {showAllPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAllPasswords ? 'Ocultar Claves' : 'Ver Todas las Claves'}
            </button>

            <button
              onClick={handleExportSecretAudit}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition text-[11px]"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar Archivo Secreto
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'CURRENT_CREDENTIALS' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>
                  Control de Usuarios, Gerentes y Cobradores. Cualquier cuenta con{' '}
                  <span className="text-rose-400 font-bold">3 intentos fallidos</span> queda bloqueada para que solo usted pueda reasignar.
                </span>
                <span className="text-amber-400 font-bold">
                  Bloqueados actualmente: {allCurrentAccounts.filter((a) => a.isLocked).length}
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                      <th className="p-3">Usuario / Nombre</th>
                      <th className="p-3">Identificador (Cédula/RNC)</th>
                      <th className="p-3">Rol en Plataforma</th>
                      <th className="p-3">Clave Secreta Actual</th>
                      <th className="p-3 text-center">Intentos Fallidos</th>
                      <th className="p-3 text-center">Estado de Seguridad</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAccounts.map((acc) => {
                      const isRevealed = showAllPasswords || revealedIds[acc.id];
                      return (
                        <tr
                          key={`${acc.accountType}-${acc.id}`}
                          className={`hover:bg-slate-800/40 transition ${
                            acc.isLocked ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-white">
                            {acc.name}
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            {acc.identifier}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${acc.roleColor}`}>
                              {acc.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 ${
                                  isRevealed ? 'text-amber-300 font-bold' : 'text-slate-500'
                                }`}
                              >
                                {isRevealed ? acc.password : '••••••••••••'}
                              </span>
                              <button
                                onClick={() => toggleReveal(acc.id)}
                                className="text-slate-400 hover:text-white p-1"
                                title="Ver / Ocultar"
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`font-black px-2 py-0.5 rounded text-[11px] ${
                                acc.failedAttempts >= 3
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : acc.failedAttempts > 0
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {acc.failedAttempts} / 3
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {acc.isLocked ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center justify-center gap-1 w-fit mx-auto shadow">
                                <Lock className="w-3 h-3" /> BLOQUEADO (3 Fallidos)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1 w-fit mx-auto border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" /> Habilitado
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedTarget({
                                  accountType: acc.accountType,
                                  id: acc.id,
                                  name: acc.name,
                                  identifier: acc.identifier,
                                  role: acc.role,
                                  isLocked: acc.isLocked,
                                  currentPassword: acc.password,
                                });
                                setNewAssignedPassword('');
                              }}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 mx-auto ${
                                acc.isLocked
                                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg'
                                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {acc.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                              {acc.isLocked ? 'Desbloquear & Reasignar' : 'Cambiar Clave'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Tab: Registro Histórico Secreto */
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                <span>
                  Registro de auditoría inviolable: guarda el histórico de cada clave asignada, fecha, hora y motivo.
                </span>
                <span className="font-bold">{filteredHistory.length} asientos históricos</span>
              </div>

              <div className="space-y-3">
                {filteredHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-amber-400 font-bold text-xs">{rec.id}</span>
                        <h4 className="font-bold text-white text-sm">{rec.userName}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {rec.identifier}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                          {rec.userRole}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{rec.changedAt}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Clave Secreta Histórica:</span>
                        <span className="font-mono font-bold text-amber-300 text-xs">
                          {showAllPasswords ? rec.secretPassword : '••••••••••••'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Tipo de Acción:</span>
                        <span className="font-semibold text-slate-200">{rec.action}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Autorizado Por:</span>
                        <span className="text-slate-300">{rec.changedBy}</span>
                      </div>
                    </div>

                    {rec.notes && (
                      <p className="text-[11px] text-slate-400 italic">
                        Nota: {rec.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Control de Seguridad Activo: Política de Bloqueo a los 3 Intentos Fallidos Habilitada.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
          >
            Cerrar Bóveda
          </button>
        </div>
      </div>

      {/* Modal Secundario: Reasignar Clave & Desbloquear */}
      {selectedTarget && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-amber-500 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Key className="w-5 h-5" />
                <h4 className="font-bold text-white text-sm">
                  {selectedTarget.isLocked ? 'Desbloquear y Reasignar Clave' : 'Reasignar Clave Secreta'}
                </h4>
              </div>
              <button
                onClick={() => setSelectedTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500">Usuario:</span>{' '}
                <span className="font-bold text-white">{selectedTarget.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Cédula / RNC:</span>{' '}
                <span className="font-mono text-amber-300">{selectedTarget.identifier}</span>
              </div>
              <div>
                <span className="text-slate-500">Rol:</span>{' '}
                <span className="font-semibold text-slate-300">{selectedTarget.role}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteReassignment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Nueva Clave Secreta Asignada *
                </label>
                <input
                  type="text"
                  required
                  value={newAssignedPassword}
                  onChange={(e) => setNewAssignedPassword(e.target.value)}
                  placeholder="Ej. Cobrador2026* o BalderaPass123"
                  className="w-full p-2.5 bg-slate-950 border border-amber-500/60 rounded-xl text-amber-300 font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Motivo / Justificación del Cambio *
                </label>
                <textarea
                  required
                  rows={2}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTarget(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Guardar & Desbloquear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
