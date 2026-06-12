import { useNavigate, useLocation } from "react-router-dom";
import {
  CalendarClock,
  UserRoundPen,
  BellRing,
  Hourglass,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size: number; className: string }>;
  path: string;
}

const navItems: NavItem[] = [
  {
    id: "appointment",
    label: "Centro de citas",
    icon: CalendarClock,
    path: "/doctor/appointments",
  },
  {
    id: "editprofile",
    label: "Editar perfil",
    icon: UserRoundPen,
    path: "/doctor/editprofile",
  },
  {
    id: "doctoravailability",
    label: "Disponibilidad",
    icon: Hourglass,
    path: "/doctor/availability",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: BellRing,
    path: "/doctor/notifications",
  },
];

export default function SidebarDoctor() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-6 space-y-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon
                size={20}
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