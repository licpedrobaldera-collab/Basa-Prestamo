import React, { useState } from 'react';
import {
  SystemUser,
  SystemSettings,
  JournalEntry,
  CompanyTenant,
  SecretPasswordVaultRecord,
} from '../../types';
import { formatDOP, formatCedula } from '../../utils/loanCalculator';
import {
  Settings,
  Users,
  ShieldCheck,
  BookOpen,
  HardDrive,
  Lock,
  Key,
  Calendar,
  Save,
  PlusCircle,
  Trash2,
  Edit,
  Download,
  Upload,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface AdminPortalProps {
  adminName: string;
  users: SystemUser[];
  settings: SystemSettings;
  journalEntries: JournalEntry[];
  companies: CompanyTenant[];
  secretVault: SecretPasswordVaultRecord[];
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (userId: string, partial: Partial<SystemUser>) => void;
  onDeleteUser: (userId: string) => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (jsonContent: string) => void;
  onExecuteDailyClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminName,
  users,
  settings,
  journalEntries,
  companies,
  secretVault,
  onUpdateSettings,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onDownloadBackup,
  onRestoreBackup,
  onExecuteDailyClose,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'parameters' | 'audit' | 'closings'>('users');

  // Parameters form state
  const [formSettings, setFormSettings] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New User modal / inline state
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserCedula, setNewUserCedula] = useState('');
  const [newUserRole, setNewUserRole] = useState<SystemUser['role']>('AUXILIAR');
  const [newUserPassword, setNewUserPassword] = useState('Dominicana2026*');

  // Search in audit
  const [auditSearch, setAuditSearch] = useState('');

  // Backup restore file state
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        onRestoreBackup(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserCedula.trim()) {
      alert('Nombre y cédula son requeridos');
      return;
    }
    const created: SystemUser = {
      id: `USR-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail || `${newUserName.toLowerCase().replace(/\s+/g, '')}@prestdominicana.do`,
      phone: newUserPhone || '809-555-0100',
      cedula: formatCedula(newUserCedula),
      role: newUserRole,
      password: newUserPassword,
      status: 'ACTIVO',
      failedAttempts: 0,
      isLocked: false,
    };
    onAddUser(created);
    setIsNewUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
    setNewUserCedula('');
  };

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const filteredAudit = journalEntries.filter(
    (entry) =>
      entry.entityName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      entry.justification.toLowerCase().includes(auditSearch.toLowerCase()) ||
      entry.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      entry.entryNumber.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-purple-400" />
                Panel de Administrador General & Auditoría
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                Admin: {adminName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Control Total de Operaciones & Configuración Maestra
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestión de personal y roles, tasas base del negocio, trazabilidad inmutable y respaldos del sistema.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={onDownloadBackup}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Descargar Backup JSON
            </button>
            <button
              onClick={() => setIsNewUserOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-xl text-xs flex items-center gap-2 border border-purple-500/30 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo Empleado
            </button>
          </div>
        </div>

        {/* 4 Admin KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Usuarios / Empleados</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-1">
              {users.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Cobradores, Auxiliares, Gerentes</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Trazabilidad en Diario</span>
            <span className="text-xl sm:text-2xl font-black text-purple-400 block mt-1">
              {journalEntries.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Asientos inmutables registrados</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Tasa Base del Sistema</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-1">
              {settings.defaultRate}% mensual
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Mora: {settings.defaultLateFeePerDay}% diario</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Empresas / Inquilinos</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {companies.length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Esquemas aislados activos</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Gestión de Usuarios & Roles ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'parameters'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Parámetros del Negocio
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Auditoría & Trazabilidad Forense ({journalEntries.length})
        </button>

        <button
          onClick={() => setActiveTab('closings')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'closings'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Cierres de Período & Respaldos
        </button>
      </div>

      {/* TAB: USUARIOS & PERMISOS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Catálogo de Usuarios y Asignación de Roles ({users.length})
            </h3>
            <button
              onClick={() => setIsNewUserOpen(true)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Agregar Empleado
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nombre & Cédula</th>
                    <th className="p-3.5">Correo & Teléfono</th>
                    <th className="p-3.5">Rol Asignado</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <span className="font-bold text-white text-sm block">{u.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">{u.cedula}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-300 block">{u.email}</span>
                        <span className="text-[11px] text-slate-500">{u.phone}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              const newStatus = u.status === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
                              onUpdateUser(u.id, { status: newStatus as any });
                            }}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold"
                          >
                            {u.status === 'ACTIVO' ? 'Bloquear' : 'Desbloquear'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al usuario ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PARÁMETROS DEL NEGOCIO */}
      {activeTab === 'parameters' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Settings className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-black text-white text-base">Configuración de Parámetros Comerciales</h3>
              <p className="text-xs text-slate-400">Tasas base, mora por día y datos institucionales</p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
              ✓ Parámetros actualizados y guardados correctamente.
            </div>
          )}

          <form onSubmit={handleSaveParameters} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Comercial de la Empresa</label>
                <input
                  type="text"
                  value={formSettings.companyName}
                  onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-purple-500 font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">RNC o Cédula Institucional</label>
                <input
                  type="text"
                  value={formSettings.rnc}
                  onChange={(e) => setFormSettings({ ...formSettings, rnc: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tasa Base Mensual (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formSettings.defaultRate}
                  onChange={(e) => setFormSettings({ ...formSettings, defaultRate: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Mora Diaria (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formSettings.defaultLateFeePerDay}
                  onChange={(e) => setFormSettings({ ...formSettings, defaultLateFeePerDay: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Días de Gracia</label>
                <input
                  type="number"
                  value={formSettings.graceDays}
                  onChange={(e) => setFormSettings({ ...formSettings, graceDays: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-bold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Dirección Principal</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Parámetros del Sistema
            </button>
          </form>
        </div>
      )}

      {/* TAB: AUDITORÍA Y LIBRO DIARIO INMUTABLE */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Libro Diario General & Trazabilidad Forense
              </h3>
              <p className="text-xs text-slate-400">
                Registro inmutable de transacciones con justificación obligatoria
              </p>
            </div>
            <input
              type="text"
              placeholder="Buscar por usuario, justificación o entidad..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white w-full sm:w-64"
            />
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Asiento</th>
                    <th className="p-3">Fecha & Hora</th>
                    <th className="p-3">Usuario Responsable</th>
                    <th className="p-3">Entidad / Operación</th>
                    <th className="p-3">Justificación / Motivo</th>
                    <th className="p-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAudit.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-amber-400">{e.entryNumber}</td>
                      <td className="p-3 text-slate-400">
                        {e.date} • {e.time}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{e.userName}</span>
                        <span className="text-[10px] text-slate-500">{e.userRole}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-slate-300 font-semibold">{e.entityName}</span>
                        <span className="text-[10px] text-purple-400 block font-mono">{e.actionType}</span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs">{e.justification}</td>
                      <td className="p-3 text-right font-black text-emerald-400">
                        {e.creditAmount ? formatDOP(e.creditAmount) : e.debitAmount ? formatDOP(e.debitAmount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CIERRES DE PERÍODO & RESPALDOS */}
      {activeTab === 'closings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-black text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Ejecución de Cierre Diario & Arqueo Contable
            </h4>
            <p className="text-xs text-slate-400">
              El cierre diario congela los movimientos del día, cuadra el efectivo recibido por los cobradores y actualiza el balance de capital.
            </p>
            <button
              onClick={() => {
                if (confirm('¿Confirmar ejecución del Cierre Diario de Operaciones?')) {
                  onExecuteDailyClose();
                  alert('¡Cierre diario ejecutado con éxito!');
                }
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Ejecutar Cierre Diario Hoy
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <h4 className="font-black text-white text-base flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Restauración de Respaldo (Backup)
            </h4>
            <p className="text-xs text-slate-400">
              Cargue un archivo `.json` de respaldo para restaurar clientes, préstamos y pagos íntegramente.
            </p>
            <label className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-500/30 cursor-pointer block text-center">
              <Upload className="w-4 h-4 inline" />
              Seleccionar Archivo JSON de Backup
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EMPLEADO */}
      {isNewUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Crear Nuevo Empleado</h3>
              <button onClick={() => setIsNewUserOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="ej. Juan Pablo Duarte"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Cédula *</label>
                  <input
                    type="text"
                    placeholder="001-XXXXXXX-X"
                    value={newUserCedula}
                    onChange={(e) => setNewUserCedula(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="809-555-0100"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Rol Operativo Asignado</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold"
                >
                  <option value="AUXILIAR">Auxiliar de Préstamos / Oficial</option>
                  <option value="COBRADOR">Mensajero / Cobrador en Ruta</option>
                  <option value="GERENTE">Gerente Operativo</option>
                  <option value="ADMIN">Administrador General</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Clave de Acceso</label>
                <input
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Registrar Empleado en el Sistema
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
