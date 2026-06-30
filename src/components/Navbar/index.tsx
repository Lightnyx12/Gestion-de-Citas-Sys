import { BriefcaseMedical, LogOut, ChevronDown, Stethoscope, ShieldCheck, UserRound } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotificationBell } from '../../lib/hooks/useNotificationBell';
import NotificationBell from './NotificationBell';
import NavbarNotificationsDropdown from './NavbarNotificationsDropdown';

// ─── Etiqueta y color por rol ────────────────────────────────────────────────

const ROLE_META = {
  patient: {
    label: 'Paciente',
    Icon: UserRound,
    labelColor: 'text-violet-800',
    avatarClass: 'bg-violet-800 text-white',
  },
  doctor: {
    label: 'Médico',
    Icon: Stethoscope,
    labelColor: 'text-blue-800',
    avatarClass: 'bg-blue-900 text-white',
  },
  admin: {
    label: 'Administrador',
    Icon: ShieldCheck,
    labelColor: 'text-emerald-800',
    avatarClass: 'bg-emerald-800 text-white',
  },
} as const;

// ─── Helper: iniciales del nombre ────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Navbar() {
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const userMenuRef  = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotif,
  } = useNotificationBell(isDoctor);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Cierra el menú de usuario al hacer clic fuera
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserMenu]);

  const roleMeta = user?.role ? ROLE_META[user.role] : null;
  const RoleIcon = roleMeta?.Icon;
  const initials = user?.name ? getInitials(user.name) : '?';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-40">
      <div className="h-16 px-6 flex items-center justify-between">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BriefcaseMedical size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">AuraHealth</h1>
            <p className="text-xs text-gray-500">Medical Portal</p>
          </div>
        </div>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">

          {/* Campana con dropdown — solo para doctores */}
          {isDoctor && (
            <div className="relative">
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setShowNotifPanel(prev => !prev)}
              />
              {showNotifPanel && (
                <NavbarNotificationsDropdown
                  unreadCount={unreadCount}
                  notifications={notifications}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onDelete={deleteNotif}
                  onClose={() => setShowNotifPanel(false)}
                />
              )}
            </div>
          )}

          {/* ── User Menu ── */}
          <div ref={userMenuRef} className="relative">
            <button
              id="navbar-user-menu-btn"
              onClick={() => setShowUserMenu(prev => !prev)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition cursor-pointer"
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  roleMeta?.avatarClass ?? 'bg-gray-800 text-white'
                }`}
              >
                {initials}
              </div>

              {/* Nombre + rol */}
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-gray-800 max-w-[140px] truncate">
                  {user?.name ?? 'Usuario'}
                </span>
                {roleMeta && (
                  <span className={`text-[10px] font-semibold ${roleMeta.labelColor}`}>
                    {roleMeta.label}
                  </span>
                )}
              </div>

              <ChevronDown
                size={14}
                className={`text-gray-700 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ animation: 'dropdownIn 0.15s ease' }}
              >
                {/* Info del usuario */}
                <div className="px-4 py-3.5 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                        roleMeta?.avatarClass ?? 'bg-gray-800 text-white'
                      }`}
                    > 
                    {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{user?.name ?? '—'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email ?? '—'}</p>
                      {roleMeta && RoleIcon && (
                        <div className={`flex items-center gap-1 mt-0.5 ${roleMeta.labelColor}`}>
                          <RoleIcon size={10} />
                          <span className="text-[10px] font-semibold">{roleMeta.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-1.5">
                  <button
                    id="navbar-logout-btn"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </nav>
  );
}
