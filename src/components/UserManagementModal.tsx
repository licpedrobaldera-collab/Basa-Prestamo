import React, { useState } from 'react';
import { AuthSession, SystemUser } from '../types';
import { formatCedula } from '../utils/loanCalculator';
import {
  Users,
  UserPlus,
  X,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
  Edit2,
  Save,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UserManagementModalProps {
  users: SystemUser[];
  currentSession: AuthSession;
  onClose: () => void;
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser, reason: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  users,
  currentSession,
  onClose,
  onAddUser,
  onUpdateUser,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'ASESOR' | 'COBRADOR' | 'SUPERVISOR' | 'GERENTE'>('COBRADOR');
  const [phone, setPhone] = useState('');
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('Cobrador2026*');

  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'ASESOR' | 'COBRADOR' | 'SUPERVISOR' | 'GERENTE'>('COBRADOR');
  const [editPhone, setEditPhone] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const startEdit = (u: SystemUser) => {
    setEditingUserId(u.id);
    setEditName(u.name);
    setEditRole(u.role);
    setEditPhone(u.phone);
    setEditCedula(u.cedula);
    setEditPassword(u.password || '');
  };

  const handleSaveEdit = (u: SystemUser) => {
    if (!editName || !editPhone) {
      alert('Nombre y teléfono son obligatorios');
      return;
    }

    const updatedUser: SystemUser = {
      ...u,
      name: editName,
      role: editRole,
      phone: editPhone,
      cedula: editCedula,
      password: editPassword || u.password,
    };

    onUpdateUser(updatedUser, `Modificación de credenciales de usuario por ${currentSession.name}`);
    setEditingUserId(null);
    confetti({ particleCount: 30 });
  };

  const handleUnlockUser = (u: SystemUser) => {
    const newPwd = prompt(`Ingrese nueva clave para desbloquear a ${u.name}:`, 'NuevaClave2026*');
    if (!newPwd) return;

    const updatedUser: SystemUser = {
      ...u,
      password: newPwd,
      isLocked: false,
      failedAttempts: 0,
      status: 'ACTIVO',
    };

    onUpdateUser(updatedUser, `Desbloqueo de cuenta tras 3 intentos fallidos y reasignación de clave autorizada`);
    confetti({ particleCount: 40 });
    alert(`¡Cuenta de ${u.name} desbloqueada y clave reasignada con éxito!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Por favor complete Nombre y Teléfono del usuario.');
      return;
    }

    const newUser: SystemUser = {
      id: `USR-${String(users.length + 1).padStart(2, '0')}`,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@prestdominicana.com`,
      role,
      phone,
      cedula: cedula || '001-0000000-0',
      password: password || '123456',
      failedAttempts: 0,
      isLocked: false,
      status: 'ACTIVO',
    };

    onAddUser(newUser);
    setShowAddForm(false);
    setName('');
    setEmail('');
    setPhone('');
    setCedula('');
    setPassword('Cobrador2026*');
    confetti({ particleCount: 40 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Gestión de Usuarios, Gerentes y Cobradores
              </h3>
              <p className="text-[11px] text-slate-400">
                Cambio de cédula, ID y clave. Control de bloqueo tras 3 intentos fallidos y reasignación de accesos.
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-300 text-xs">
              Equipo Registrado en Plataforma ({users.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <UserPlus className="w-4 h-4" />
              {showAddForm ? 'Cerrar Formulario' : 'Registrar Nuevo Cobrador / Gerente'}
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-3"
            >
              <h4 className="font-bold text-amber-400 text-xs">
                Nuevo Integrante del Equipo de Crédito
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ej. Carolina Méndez"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Rol en el Sistema *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-bold text-amber-400"
                  >
                    <option value="COBRADOR">Cobrador de Ruta (Cédula / ID)</option>
                    <option value="GERENTE">Gerente / Propietario</option>
                    <option value="ASESOR">Asesor de Crédito</option>
                    <option value="SUPERVISOR">Supervisor General</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="829-000-0000"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Cédula Dominicana</label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(formatCedula(e.target.value))}
                    placeholder="001-0000000-0"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Clave de Acceso Inicial *</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@prestamos.com"
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID / Usuario</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Cédula / Identificador</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Clave</th>
                    <th className="p-3 text-center">Intentos</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const showPwd = showPasswordMap[u.id];

                    return (
                      <tr key={u.id} className={`hover:bg-slate-900/60 transition ${u.isLocked ? 'bg-rose-950/25' : ''}`}>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs w-full"
                            />
                          ) : (
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span className="font-mono text-amber-400 text-xs">{u.id}</span>
                                {u.name}
                              </div>
                              <div className="text-[10px] text-slate-400">{u.email}</div>
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as any)}
                              className="p-1 bg-slate-900 border border-slate-700 rounded text-amber-400 text-xs font-bold"
                            >
                              <option value="COBRADOR">COBRADOR</option>
                              <option value="GERENTE">GERENTE</option>
                              <option value="ASESOR">ASESOR</option>
                              <option value="SUPERVISOR">SUPERVISOR</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {u.role}
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editCedula}
                              onChange={(e) => setEditCedula(formatCedula(e.target.value))}
                              className="p-1 bg-slate-900 border border-slate-700 rounded text-amber-300 text-xs font-mono"
                            />
                          ) : (
                            <span className="text-slate-300">{u.cedula}</span>
                          )}
                        </td>

                        <td className="p-3 font-mono">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="p-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                            />
                          ) : (
                            <span className="text-slate-300">{u.phone}</span>
                          )}
                        </td>

                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              className="p-1 bg-slate-900 border border-amber-500 rounded text-amber-300 text-xs font-mono font-bold"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] text-amber-300">
                                {showPwd ? u.password || '••••••' : '••••••'}
                              </span>
                              <button
                                onClick={() =>
                                  setShowPasswordMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }))
                                }
                                className="text-slate-500 hover:text-slate-300 p-0.5"
                              >
                                {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="p-3 text-center font-black">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              u.failedAttempts && u.failedAttempts >= 3
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {u.failedAttempts || 0} / 3
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          {u.isLocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white flex items-center justify-center gap-1 mx-auto w-fit">
                              <Lock className="w-3 h-3" /> BLOQUEADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1 mx-auto w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Activo
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveEdit(u)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" /> Guardar
                              </button>
                            ) : (
                              <button
                                onClick={() => startEdit(u)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                              >
                                <Edit2 className="w-3 h-3" /> Editar
                              </button>
                            )}

                            {u.isLocked && (
                              <button
                                onClick={() => handleUnlockUser(u)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-black flex items-center gap-1 shadow"
                              >
                                <Unlock className="w-3 h-3" /> Desbloquear
                              </button>
                            )}
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
      </div>
    </div>
  );
};
