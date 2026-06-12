import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboardIcon, NotebookIcon, List } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "appointment",
    label: "Appointment",
    icon: LayoutDashboardIcon,
    path: "/admin/dashboard",
  },
  {
    id: "register",
    label: "Registro Docs",
    icon: NotebookIcon,
    path: "/admin/AdminDocManager",
  },
  {
    id: "doctors",
    label: "Directorio Docs",
    icon: List,
    path: "/admin/AdminDoctors",
  },
];

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <h5 className="text-lg font-bold text-center text-gray-900 mb-1 px-4 py-3">
        Panel de Administrador
      </h5>

      <nav className="p-2 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-[3px] px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon
                size={18}
                className="text-current"
              />

              <span className="font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}