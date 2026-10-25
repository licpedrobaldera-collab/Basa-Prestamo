import React, { useState } from 'react';
import { Client, CompanyTenant, Loan, PasswordHistoryItem, SystemSettings } from '../types';
import { exportToCSV, formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  ShieldCheck,
  Building,
  Users,
  Key,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Edit3,
  Calendar,
  Lock,
  Search,
  DollarSign,
  X,
  History,
  RotateCcw,
  FileJson,
  FileSpreadsheet,
  Save,
  UserCheck,
  Phone,
  Mail,
  Shield,
  Layers,
} from 'lucide-react';

interface SuperAdminLicensingModalProps {
  companies: CompanyTenant[];
  clients: Client[];
  loans: Loan[];
  settings: SystemSettings;
  onClose: () => void;
  onUpdateCompanies: (updated: CompanyTenant[]) => void;
  onUpdateClients: (updated: Client[]) => void;
  onUpdateSettings: (newSettings: SystemSettings) => void;
}

export const SuperAdminLicensingModal: React.FC<SuperAdminLicensingModalProps> = ({
  companies,
  clients,
  loans,
  settings,
  onClose,
  onUpdateCompanies,
  onUpdateClients,
  onUpdateSettings,
}) => {
  const [activeSection, setActiveSection] = useState<'PRESTAMISTAS' | 'CLIENTES'>('PRESTAMISTAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Password modal states
  const [selectedCompanyForPassword, setSelectedCompanyForPassword] = useState<CompanyTenant | null>(null);
  const [selectedClientForPassword, setSelectedClientForPassword] = useState<Client | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [passwordReason, setPasswordReason] = useState('');

  // Edit / Repair Fault states
  const [editingCompany, setEditingCompany] = useState<CompanyTenant | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Admin Master Credentials State (Actualizable por Lic Pedro Baldera cuando él desee)
  const [adminCedula, setAdminCedula] = useState(settings.adminCedula || '001-1492817-3');
  const [adminPassword, setAdminPassword] = useState(settings.adminPassword || 'BalderaAdmin2026*');
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || 'licpedrobaldera@gmail.com');
  const [adminSavedFeedback, setAdminSavedFeedback] = useState(false);

  // Pricing constants for memberships
  const planPrices = {
    DEMO_7_DIAS: 0,
    MENSUAL: 2500,
    SEIS_MESES: 12000,
    ANUAL: 20000,
    DOS_ANOS: 35000,
    TRES_ANOS: 48000,
  };

  // Helper for trial days remaining
  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 1. Approve 7-day free trial
  const handleApproveDemo = (companyId: string) => {
    const today = new Date();
    const expiration = new Date();
    expiration.setDate(today.getDate() + 7);

    const updated = companies.map((c) => {
      if (c.id === companyId) {
        return {
          ...c,
          status: 'DEMO_ACTIVO' as const,
          trialStartDate: today.toISOString().split('T')[0],
          trialEndDate: expiration.toISOString().split('T')[0],
          membershipPlan: 'DEMO_7_DIAS' as const,
          membershipExpirationDate: expiration.toISOString().split('T')[0],
          approvedBy: 'Lic Pedro Baldera',
          approvedAt: today.toISOString().split('T')[0],
          notes: `${c.notes || ''} [Demo de 7 días gratis aprobado por Lic Pedro Baldera el ${today.toISOString().split('T')[0]}]`,
        };
      }
      return c;
    });

    onUpdateCompanies(updated);
    alert('¡Demo de 7 Días Gratis Aprobado Exitosamente por Lic. Pedro Baldera!');
  };

  // 2. Upgrade / Reactivate to Paid Membership (Preserves all historical data)
  const handleUpgradePaid = (
    companyId: string,
    plan: 'MENSUAL' | 'SEIS_MESES' | 'ANUAL' | 'DOS_ANOS' | 'TRES_ANOS'
  ) => {
    const today = new Date();
    const expiration = new Date();

    if (plan === 'MENSUAL') expiration.setMonth(today.getMonth() + 1);
    else if (plan === 'SEIS_MESES') expiration.setMonth(today.getMonth() + 6);
    else if (plan === 'ANUAL') expiration.setFullYear(today.getFullYear() + 1);
    else if (plan === 'DOS_ANOS') expiration.setFullYear(today.getFullYear() + 2);
    else if (plan === 'TRES_ANOS') expiration.setFullYear(today.getFullYear() + 3);

    const updated = companies.map((c) => {
      if (c.id === companyId) {
        return {
          ...c,
          status: 'PAGADO_ACTIVO' as const,
          membershipPlan: plan,
          membershipExpirationDate: expiration.toISOString().split('T')[0],
          membershipPrice: planPrices[plan],
          approvedBy: 'Lic Pedro Baldera',
          approvedAt: today.toISOString().split('T')[0],
          notes: `${c.notes || ''} [Membresía Pagada ${plan} activada el ${today.toISOString().split('T')[0]}]`,
        };
      }
      return c;
    });

    onUpdateCompanies(updated);
    alert(`¡Membresía ${plan} activada con éxito! La data e histórico de préstamos y clientes del prestamista se mantienen 100% intactos.`);
  };

  // 3. Save Master SuperAdmin Credentials
  const handleSaveAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      adminCedula,
      adminPassword,
      adminEmail,
    });
    setAdminSavedFeedback(true);
    setTimeout(() => setAdminSavedFeedback(false), 2500);
  };

  // 4. Change Prestamista Password with Audit Trail
  const handleChangeCompanyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyForPassword || !newPasswordValue) return;

    const newHistoryItem: PasswordHistoryItem = {
      id: `PWD-${Date.now()}`,
      passwordHash: newPasswordValue,
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: 'Lic Pedro Baldera (SuperAdmin)',
      reason: passwordReason || 'Actualización por soporte técnico ante reporte de fallo',
    };

    const updated = companies.map((c) => {
      if (c.id === selectedCompanyForPassword.id) {
        return {
          ...c,
          password: newPasswordValue,
          passwordHistory: [newHistoryItem, ...(c.passwordHistory || [])],
        };
      }
      return c;
    });

    onUpdateCompanies(updated);
    setSelectedCompanyForPassword(null);
    setNewPasswordValue('');
    setPasswordReason('');
    alert('Contraseña del prestamista actualizada e historial de auditoría registrado correctamente.');
  };

  // 5. Change Client Password with Audit Trail
  const handleChangeClientPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPassword || !newPasswordValue) return;

    const newHistoryItem: PasswordHistoryItem = {
      id: `PWD-CLI-${Date.now()}`,
      passwordHash: newPasswordValue,
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: 'Lic Pedro Baldera (SuperAdmin)',
      reason: passwordReason || 'Restablecimiento de clave por soporte técnico',
    };

    const updated = clients.map((cl) => {
      if (cl.id === selectedClientForPassword.id) {
        return {
          ...cl,
          password: newPasswordValue,
          passwordHistory: [newHistoryItem, ...(cl.passwordHistory || [])],
        };
      }
      return cl;
    });

    onUpdateClients(updated);
    setSelectedClientForPassword(null);
    setNewPasswordValue('');
    setPasswordReason('');
    alert('Contraseña del cliente/garante actualizada e historial de auditoría registrado correctamente.');
  };

  // 6. Save Edited Prestamista (Fix Failure)
  const handleSaveEditedCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    const updated = companies.map((c) => (c.id === editingCompany.id ? editingCompany : c));
    onUpdateCompanies(updated);
    setEditingCompany(null);
    alert('Ficha del prestamista actualizada y corregida en el sistema.');
  };

  // 7. Save Edited Client (Fix Failure)
  const handleSaveEditedClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const updated = clients.map((cl) => (cl.id === editingClient.id ? editingClient : cl));
    onUpdateClients(updated);
    setEditingClient(null);
    alert('Ficha histórica del cliente/garante actualizada y corregida en el sistema.');
  };

  // 8. Download Downloads / Backups
  const downloadJSON = (data: any, filename: string) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadPrestamistasHistoryJSON = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJSON(
      {
        modulo: 'SECCION_HISTORICO_PRESTAMISTAS',
        superAdmin: 'Lic Pedro Baldera',
        timestamp: new Date().toISOString(),
        totalPrestamistas: companies.length,
        prestamistas: companies,
      },
      `HISTORICO_PRESTAMISTAS_${timestamp}.json`
    );
  };

  const handleDownloadPrestamistasHistoryExcel = () => {
    const headers = [
      'ID Empresa',
      'Nombre Comercial',
      'RNC / Cédula',
      'Propietario',
      'Email',
      'Teléfono',
      'Estado Licencia',
      'Plan Membresía',
      'Vencimiento',
      'Precio Plan DOP',
      'Aprobado Por',
    ];
    const rows = companies.map((c) => [
      c.id,
      c.name,
      c.rncOrCedula,
      c.ownerName,
      c.email,
      c.phone,
      c.status,
      c.membershipPlan,
      c.membershipExpirationDate || 'N/A',
      c.membershipPrice,
      c.approvedBy || 'N/A',
    ]);
    exportToCSV(`HISTORICO_PRESTAMISTAS_EXCEL_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleDownloadPrestamistasPasswords = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pwdData = companies.map((c) => ({
      empresaId: c.id,
      nombre: c.name,
      rnc: c.rncOrCedula,
      email: c.email,
      claveActual: c.password,
      historialCambios: c.passwordHistory || [],
    }));
    downloadJSON(
      {
        modulo: 'AUDITORIA_CLAVES_PRESTAMISTAS',
        superAdmin: 'Lic Pedro Baldera',
        timestamp: new Date().toISOString(),
        registros: pwdData,
      },
      `HISTORIAL_CLAVES_PRESTAMISTAS_${timestamp}.json`
    );
  };

  const handleDownloadClientsHistoryJSON = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJSON(
      {
        modulo: 'SECCION_HISTORICO_CLIENTES_DE_PRESTAMISTAS',
        superAdmin: 'Lic Pedro Baldera',
        timestamp: new Date().toISOString(),
        totalClientes: clients.length,
        clientes: clients.map((cl) => {
          const clientLoans = loans.filter((l) => l.clientId === cl.id);
          return {
            ...cl,
            prestamosAsociados: clientLoans,
          };
        }),
      },
      `HISTORICO_CLIENTES_PRESTAMISTAS_${timestamp}.json`
    );
  };

  const handleDownloadClientsHistoryExcel = () => {
    const headers = [
      'ID Cliente',
      'Nombre Completo',
      'Cédula Electoral',
      'Teléfono',
      'WhatsApp',
      'Ingreso Mensual DOP',
      'Categoría 4 Garante',
      'Cédula Garante',
      'Categoría 5 Co-deudor',
      'Cédula Co-deudor',
      'Score Crediticio',
      'Empresa / Prestamista',
    ];
    const rows = clients.map((cl) => {
      const comp = companies.find((c) => c.id === cl.companyId)?.name || 'Inversiones Baldera';
      return [
        cl.id,
        cl.name,
        cl.cedula,
        cl.phone,
        cl.whatsapp,
        cl.monthlyIncome,
        cl.guarantor || 'N/A',
        cl.guarantorCedula || 'N/A',
        cl.coDebtor || 'N/A',
        cl.coDebtorCedula || 'N/A',
        cl.creditScore || 'N/A',
        comp,
      ];
    });
    exportToCSV(`HISTORICO_CLIENTES_EXCEL_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleDownloadClientsPasswords = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pwdData = clients.map((cl) => ({
      clienteId: cl.id,
      nombre: cl.name,
      cedula: cl.cedula,
      email: cl.email || 'N/A',
      claveActual: cl.password || 'Sin clave asignada',
      garante: cl.guarantor,
      codeudor: cl.coDebtor,
      historialCambios: cl.passwordHistory || [],
    }));
    downloadJSON(
      {
        modulo: 'AUDITORIA_CLAVES_CLIENTES_Y_CODEUDORES',
        superAdmin: 'Lic Pedro Baldera',
        timestamp: new Date().toISOString(),
        registros: pwdData,
      },
      `HISTORIAL_CLAVES_CLIENTES_${timestamp}.json`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Panel Maestro de Licencias, Claves & Auditoría
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                  SuperAdmin: Lic Pedro Baldera (Cat. 1)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Aprobación de 7 días demo, actualización a versión pagada, histórico de prestamistas y clientes de prestamistas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cerrar panel maestro"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs bg-slate-950/40">
          {/* Section 1: SuperAdmin Master Credentials Setup */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Credenciales Maestras del Administrador (Lic. Pedro Baldera - Categoría 1)
              </span>
              {adminSavedFeedback && (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> ¡Credenciales maestras actualizadas y guardadas con éxito!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveAdminCredentials} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Usuario (Número de Cédula)</label>
                <input
                  type="text"
                  value={adminCedula}
                  onChange={(e) => setAdminCedula(formatCedula(e.target.value))}
                  required
                  placeholder="001-1492817-3"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Contraseña Maestra</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-bold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Correo Electrónico de Recuperación</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:border-amber-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Actualizar Mi Clave Maestra
                </button>
              </div>
            </form>
          </div>

          {/* Section Selector Tabs: Sección 1 (Prestamistas) vs Sección 2 (Clientes de Prestamistas) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveSection('PRESTAMISTAS');
                  setSearchTerm('');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                  activeSection === 'PRESTAMISTAS'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building className="w-4 h-4" />
                Sección: Histórico de Prestamistas ({companies.length})
              </button>

              <button
                onClick={() => {
                  setActiveSection('CLIENTES');
                  setSearchTerm('');
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                  activeSection === 'CLIENTES'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Sección: Clientes de Prestamistas ({clients.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeSection === 'PRESTAMISTAS'
                    ? 'Buscar prestamista, RNC, nombre...'
                    : 'Buscar cliente, cédula, garante...'
                }
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-amber-500"
              />
            </div>
          </div>

          {/* TAB 1: SECCIÓN DE HISTÓRICO DE PRESTAMISTAS */}
          {activeSection === 'PRESTAMISTAS' && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-400" />
                    Directorio & Control de Empresas Prestamistas Registradas
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Aprobación de los 7 días demo, cobro de igualas mensuales o membresías (6 meses, anual, 2 o 3 años) y gestión de fallas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadPrestamistasHistoryJSON}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition"
                    title="Descargar base de datos histórica de prestamistas en JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descargar JSON</span>
                  </button>
                  <button
                    onClick={handleDownloadPrestamistasHistoryExcel}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow"
                    title="Exportar a Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    onClick={handleDownloadPrestamistasPasswords}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold flex items-center gap-1.5 border border-amber-500/40 transition"
                    title="Descargar historial de contraseñas de prestamistas"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Historial Claves</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Empresa / Prestamista</th>
                        <th className="p-3">RNC / Cédula</th>
                        <th className="p-3">Contacto / Correo</th>
                        <th className="p-3">Estado Licencia</th>
                        <th className="p-3">Vigencia / Plan</th>
                        <th className="p-3 text-center">Acciones Pedro Baldera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {companies
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.rncOrCedula.includes(searchTerm) ||
                            c.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((c) => {
                          const isPending = c.status === 'PENDIENTE_APROBACION';
                          const isDemoActive = c.status === 'DEMO_ACTIVO';
                          const isDemoExpired = c.status === 'DEMO_VENCIDO';
                          const isPaid = c.status === 'PAGADO_ACTIVO';
                          const daysLeft = isDemoActive ? getDaysRemaining(c.trialEndDate) : 0;

                          return (
                            <tr key={c.id} className="hover:bg-slate-900/60 transition">
                              <td className="p-3">
                                <div className="font-bold text-white text-sm">{c.name}</div>
                                <div className="text-[10px] text-amber-400 font-semibold">
                                  Propietario: {c.ownerName}
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold text-slate-300">
                                {c.rncOrCedula}
                              </td>

                              <td className="p-3">
                                <div className="text-slate-200">{c.phone}</div>
                                <div className="text-[10px] text-slate-400">{c.email}</div>
                              </td>

                              <td className="p-3">
                                {isPending && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Esperando Aprobación
                                  </span>
                                )}
                                {isDemoActive && (
                                  <div className="space-y-0.5">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                      Demo 7 Días Activo
                                    </span>
                                    <div className="text-[10px] text-sky-400 font-bold">
                                      ⏳ {daysLeft} días restantes
                                    </div>
                                  </div>
                                )}
                                {isDemoExpired && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    Demo Vencido (Requiere Pago)
                                  </span>
                                )}
                                {isPaid && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Versión Pagada Activa
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="font-bold text-slate-200">
                                  {c.membershipPlan === 'DEMO_7_DIAS' && 'Demo Gratis (7 días)'}
                                  {c.membershipPlan === 'MENSUAL' && 'Mensualidad Fija'}
                                  {c.membershipPlan === 'SEIS_MESES' && 'Membresía 6 Meses'}
                                  {c.membershipPlan === 'ANUAL' && 'Membresía Anual (1 Año)'}
                                  {c.membershipPlan === 'DOS_ANOS' && 'Membresía 2 Años'}
                                  {c.membershipPlan === 'TRES_ANOS' && 'Membresía 3 Años'}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Vence: {c.membershipExpirationDate || 'N/A'}
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {isPending && (
                                    <button
                                      onClick={() => handleApproveDemo(c.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                                      title="Aprobar 7 días de demo gratis"
                                    >
                                      Aprobar 7 Días Demo
                                    </button>
                                  )}

                                  {(isDemoActive || isDemoExpired || isPaid) && (
                                    <div className="relative group">
                                      <button className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-lg text-xs font-bold shadow flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span>Activar Pago</span>
                                      </button>

                                      <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 hidden group-hover:block text-left text-[11px]">
                                        <div className="p-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-800">
                                          Planes e Igualas Disponibles:
                                        </div>
                                        <button
                                          onClick={() => handleUpgradePaid(c.id, 'MENSUAL')}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                                        >
                                          Mensualidad: DOP $2,500/mes
                                        </button>
                                        <button
                                          onClick={() => handleUpgradePaid(c.id, 'SEIS_MESES')}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 font-semibold text-amber-400"
                                        >
                                          Membresía 6 Meses: DOP $12,000
                                        </button>
                                        <button
                                          onClick={() => handleUpgradePaid(c.id, 'ANUAL')}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 font-semibold text-emerald-400"
                                        >
                                          Plan Anual (1 Año): DOP $20,000
                                        </button>
                                        <button
                                          onClick={() => handleUpgradePaid(c.id, 'DOS_ANOS')}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                                        >
                                          Plan 2 Años: DOP $35,000
                                        </button>
                                        <button
                                          onClick={() => handleUpgradePaid(c.id, 'TRES_ANOS')}
                                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200"
                                        >
                                          Plan 3 Años: DOP $48,000
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => setEditingCompany(c)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                                    title="Editar o reparar fallos en los datos del prestamista"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedCompanyForPassword(c)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                                    title="Gestionar y ver historial de contraseñas"
                                  >
                                    <Key className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Claves</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECCIÓN DE CLIENTES DE PRESTAMISTAS */}
          {activeSection === 'CLIENTES' && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Sección de Histórico de Clientes de Prestamistas ({clients.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Control de expedientes individuales, garantes (Cat. 4), codeudores (Cat. 5), resolución de fallos y auditoría de claves.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadClientsHistoryJSON}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 transition"
                    title="Descargar base de datos histórica de clientes en JSON"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descargar JSON</span>
                  </button>
                  <button
                    onClick={handleDownloadClientsHistoryExcel}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow"
                    title="Exportar a Excel (CSV)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar Excel</span>
                  </button>
                  <button
                    onClick={handleDownloadClientsPasswords}
                    className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold flex items-center gap-1.5 border border-amber-500/40 transition"
                    title="Descargar historial de contraseñas de clientes"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Historial Claves</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Cliente (Cat. 3)</th>
                        <th className="p-3">Cédula Electoral</th>
                        <th className="p-3">Prestamista Asociado</th>
                        <th className="p-3">Garante (Cat. 4)</th>
                        <th className="p-3">Co-deudor (Cat. 5)</th>
                        <th className="p-3">Deuda / Préstamos</th>
                        <th className="p-3 text-center">Acciones Pedro Baldera</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {clients
                        .filter(
                          (cl) =>
                            cl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            cl.cedula.includes(searchTerm) ||
                            (cl.guarantor && cl.guarantor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (cl.coDebtor && cl.coDebtor.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((cl) => {
                          const clientLoans = loans.filter((l) => l.clientId === cl.id);
                          const activeDebt = clientLoans
                            .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
                            .reduce((sum, l) => sum + l.balance, 0);
                          const compName =
                            companies.find((c) => c.id === cl.companyId)?.name || 'Inversiones Baldera';

                          return (
                            <tr key={cl.id} className="hover:bg-slate-900/60 transition">
                              <td className="p-3">
                                <div className="font-bold text-white text-sm">{cl.name}</div>
                                <div className="text-[10px] text-slate-400">
                                  {cl.phone} • {cl.occupation}
                                </div>
                              </td>

                              <td className="p-3 font-mono font-bold text-slate-300">
                                {cl.cedula}
                              </td>

                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-semibold">
                                  {compName}
                                </span>
                              </td>

                              <td className="p-3">
                                {cl.guarantor ? (
                                  <div>
                                    <div className="font-semibold text-purple-300">{cl.guarantor}</div>
                                    <div className="text-[10px] font-mono text-slate-400">
                                      {cl.guarantorCedula || 'Sin cédula'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500">Ninguno</span>
                                )}
                              </td>

                              <td className="p-3">
                                {cl.coDebtor ? (
                                  <div>
                                    <div className="font-semibold text-amber-300">{cl.coDebtor}</div>
                                    <div className="text-[10px] font-mono text-slate-400">
                                      {cl.coDebtorCedula || 'Sin cédula'}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-500">Ninguno</span>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="font-bold text-amber-400">{formatDOP(activeDebt)}</div>
                                <div className="text-[10px] text-slate-500">
                                  {clientLoans.length} préstamo(s)
                                </div>
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => setEditingClient(cl)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                                    title="Editar o reparar fallos en el registro del cliente"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedClientForPassword(cl)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700"
                                    title="Gestionar y actualizar contraseña del cliente"
                                  >
                                    <Key className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Claves</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PASSWORD MODAL FOR PRESTAMISTA */}
      {selectedCompanyForPassword && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  Seguridad & Historial de Claves del Prestamista
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedCompanyForPassword.name} • {selectedCompanyForPassword.rncOrCedula}
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyForPassword(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Contraseña Actual Registrada:</span>
              <div className="text-sm font-mono font-bold text-amber-400">
                {selectedCompanyForPassword.password}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <History className="w-3.5 h-3.5 text-sky-400" />
                Historial de Cambios de Contraseña
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedCompanyForPassword.passwordHistory && selectedCompanyForPassword.passwordHistory.length > 0 ? (
                  selectedCompanyForPassword.passwordHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] space-y-0.5"
                    >
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-slate-200">{item.passwordHash}</span>
                        <span className="text-slate-500">{item.changedAt}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Por: {item.changedBy} {item.reason ? `• Motivo: ${item.reason}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-2">Sin historial previo de cambios.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleChangeCompanyPassword} className="pt-2 border-t border-slate-800 space-y-3">
              <h4 className="font-bold text-amber-400 text-xs">
                Restablecer o Asignar Nueva Contraseña al Prestamista
              </h4>
              <div>
                <label className="text-slate-400 block mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  required
                  placeholder="Ingrese nueva contraseña"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Motivo del Cambio</label>
                <input
                  type="text"
                  value={passwordReason}
                  onChange={(e) => setPasswordReason(e.target.value)}
                  placeholder="Ej. Olvido de clave o soporte técnico por llamada"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyForPassword(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Guardar y Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL FOR CLIENT / GARANTE / CODEUDOR */}
      {selectedClientForPassword && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  Seguridad & Clave de Cliente / Garante / Codeudor
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedClientForPassword.name} • Cédula: {selectedClientForPassword.cedula}
                </p>
              </div>
              <button
                onClick={() => setSelectedClientForPassword(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Contraseña Actual:</span>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {selectedClientForPassword.password || 'Sin clave establecida aún'}
              </div>
              {selectedClientForPassword.email && (
                <div className="text-[11px] text-slate-400">
                  Correo registrado: {selectedClientForPassword.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <History className="w-3.5 h-3.5 text-sky-400" />
                Historial de Cambios de Contraseña
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedClientForPassword.passwordHistory && selectedClientForPassword.passwordHistory.length > 0 ? (
                  selectedClientForPassword.passwordHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] space-y-0.5"
                    >
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-slate-200">{item.passwordHash}</span>
                        <span className="text-slate-500">{item.changedAt}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Por: {item.changedBy} {item.reason ? `• Motivo: ${item.reason}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-2">Sin historial previo de cambios.</p>
                )}
              </div>
            </div>

            <form onSubmit={handleChangeClientPassword} className="pt-2 border-t border-slate-800 space-y-3">
              <h4 className="font-bold text-emerald-400 text-xs">
                Actualizar / Restablecer Clave del Cliente
              </h4>
              <div>
                <label className="text-slate-400 block mb-1">Nueva Contraseña</label>
                <input
                  type="text"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  required
                  placeholder="Ingrese nueva contraseña para el cliente"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Motivo del Cambio</label>
                <input
                  type="text"
                  value={passwordReason}
                  onChange={(e) => setPasswordReason(e.target.value)}
                  placeholder="Ej. Solicitud de acceso o cliente olvidó su contraseña"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPassword(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Guardar y Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REPAIR PRESTAMISTA MODAL */}
      {editingCompany && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-400" />
                Editar / Reparar Datos de Prestamista ({editingCompany.name})
              </h3>
              <button onClick={() => setEditingCompany(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCompany} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  required
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">RNC o Cédula</label>
                  <input
                    type="text"
                    value={editingCompany.rncOrCedula}
                    onChange={(e) => setEditingCompany({ ...editingCompany, rncOrCedula: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Propietario</label>
                  <input
                    type="text"
                    value={editingCompany.ownerName}
                    onChange={(e) => setEditingCompany({ ...editingCompany, ownerName: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingCompany.phone}
                    onChange={(e) => setEditingCompany({ ...editingCompany, phone: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingCompany.email}
                    onChange={(e) => setEditingCompany({ ...editingCompany, email: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notas Administrativas</label>
                <textarea
                  value={editingCompany.notes || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, notes: e.target.value })}
                  rows={2}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
                >
                  Guardar Correcciones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REPAIR CLIENT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Editar / Reparar Ficha de Cliente ({editingClient.name})
              </h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedClient} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cédula Electoral</label>
                  <input
                    type="text"
                    value={editingClient.cedula}
                    onChange={(e) => setEditingClient({ ...editingClient, cedula: formatCedula(e.target.value) })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editingClient.whatsapp}
                    onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-purple-400 block mb-1 font-semibold">Garante (Cat. 4)</label>
                  <input
                    type="text"
                    value={editingClient.guarantor || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, guarantor: e.target.value })}
                    placeholder="Nombre del fiador solidario"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-purple-400 block mb-1 font-semibold">Cédula Garante</label>
                  <input
                    type="text"
                    value={editingClient.guarantorCedula || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, guarantorCedula: formatCedula(e.target.value) })}
                    placeholder="001-XXXXXXX-X"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-amber-400 block mb-1 font-semibold">Co-deudor (Cat. 5)</label>
                  <input
                    type="text"
                    value={editingClient.coDebtor || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, coDebtor: e.target.value })}
                    placeholder="Segundo deudor solidario"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-amber-400 block mb-1 font-semibold">Cédula Co-deudor</label>
                  <input
                    type="text"
                    value={editingClient.coDebtorCedula || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, coDebtorCedula: formatCedula(e.target.value) })}
                    placeholder="001-XXXXXXX-X"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Guardar y Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
