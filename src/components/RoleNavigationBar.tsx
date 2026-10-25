import React, { useState } from 'react';
import { AppRole, AuthSession } from '../types';
import { APP_ROLES, TRACEABILITY_MATRIX } from '../utils/rbacConfig';
import {
  User,
  Navigation,
  FileCheck,
  ShieldCheck,
  Settings,
  Terminal,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface RoleNavigationBarProps {
  currentRole: AppRole;
  onSelectRole: (role: AppRole) => void;
  currentSession: AuthSession;
  onOpenAuthModal: () => void;
}

export const RoleNavigationBar: React.FC<RoleNavigationBarProps> = ({
  currentRole,
  onSelectRole,
  currentSession,
  onOpenAuthModal,
}) => {
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'CLIENTE':
        return <User className="w-4 h-4" />;
      case 'COBRADOR':
        return <Navigation className="w-4 h-4" />;
      case 'AUXILIAR':
        return <FileCheck className="w-4 h-4" />;
      case 'GERENTE':
        return <ShieldCheck className="w-4 h-4" />;
      case 'ADMIN':
        return <Settings className="w-4 h-4" />;
      case 'DEV':
        return <Terminal className="w-4 h-4" />;
    }
  };

  const rolesList: AppRole[] = ['CLIENTE', 'COBRADOR', 'AUXILIAR', 'GERENTE', 'ADMIN', 'DEV'];

  return (
    <>
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Left: Active Role Indicator & Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline mr-1">
              Portales RBAC:
            </span>

            {rolesList.map((r) => {
              const meta = APP_ROLES[r];
              const isActive = currentRole === r;

              return (
                <button
                  key={r}
                  onClick={() => onSelectRole(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    isActive
                      ? `${meta.badgeColor} shadow-lg shadow-black/40 scale-102 ring-1 ring-white/10`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
                  }`}
                  title={meta.shortDescription}
                >
                  {getRoleIcon(r)}
                  <span>{meta.label.split(' / ')[0]}</span>
                  <span className="text-[9px] font-mono opacity-70">
                    ({meta.portalPath})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: User Identification & Matrix Info Modal Trigger */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setIsMatrixModalOpen(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Ver Matriz de Trazabilidad y Alcance de Roles"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Matriz de Roles</span>
            </button>

            <button
              onClick={onOpenAuthModal}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition cursor-pointer"
              title="Identificarse con Cédula, RNC o Cuenta"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="truncate max-w-[120px]">{currentSession.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: TABLA RESUMEN DE TRAZABILIDAD Y ALCANCE */}
      {isMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Matriz de Trazabilidad, Permisos y Alcance Operativo (RBAC)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Arquitectura de control de acceso basada en roles diseñada para confidencialidad y segregación de funciones.
                </p>
              </div>
              <button
                onClick={() => setIsMatrixModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Rol / Perfil</th>
                      <th className="p-3.5">Ver Clientes</th>
                      <th className="p-3.5">Aprobar Préstamos</th>
                      <th className="p-3.5">Cobrar en Ruta</th>
                      <th className="p-3.5">Cobrar en Oficina</th>
                      <th className="p-3.5">Configurar Sistema</th>
                      <th className="p-3.5">Ver Auditoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {TRACEABILITY_MATRIX.map((item) => (
                      <tr
                        key={item.role}
                        className={`hover:bg-slate-800/40 transition ${
                          currentRole === item.role ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="p-3.5 font-bold text-white">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${item.badge}`}>
                            {item.label}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-semibold">{item.verClientes}</td>
                        <td className="p-3.5 text-slate-300">{item.aprobarPrestamos}</td>
                        <td className="p-3.5 text-slate-300">{item.cobrarEnRuta}</td>
                        <td className="p-3.5 text-slate-300">{item.cobrarEnOficina}</td>
                        <td className="p-3.5 text-slate-300">{item.configurarSistema}</td>
                        <td className="p-3.5 text-slate-300">{item.verAuditoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
              <span>Haga clic en cualquiera de los portales en la barra superior para navegar con dicho perfil.</span>
              <button
                onClick={() => setIsMatrixModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
