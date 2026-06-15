import { Calendar } from "lucide-react";
import type { TabType } from "./appointments.types";

interface AppointmentTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
}

const AppointmentTabs = ({
  activeTab,
  onTabChange,
  todayCount,
  upcomingCount,
  completedCount,
}: AppointmentTabsProps) => {
  const tabClass = (tab: TabType) =>
    `pb-3 px-4 text-sm font-bold border-b-2 transition-all relative shrink-0 cursor-pointer ${activeTab === tab
      ? "border-blue-900 text-blue-900 font-extrabold"
      : "border-transparent text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
      <button
        type="button"
        onClick={() => onTabChange("today")}
        className={tabClass("today")}
      >
        Hoy
        {todayCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-900 rounded-full font-bold">
            {todayCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("upcoming")}
        className={tabClass("upcoming")}
      >
        Próximas
        {upcomingCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-900 rounded-full font-bold">
            {upcomingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("completed")}
        className={tabClass("completed")}
      >
        Atendidas
        {completedCount > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-900 rounded-full font-bold">
            {completedCount}
          </span>
        )}
      </button>
    </div>
  );
};

// ─── Empty state cuando no hay cita seleccionada ─────────────────────────────
interface EmptySelectionProps {
  activeTab: TabType;
}

export const EmptySelection = ({ activeTab }: EmptySelectionProps) => (
  <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
    <Calendar className="w-12 h-12 text-gray-300 mb-3" />
    <p className="text-gray-500 font-medium">
      {activeTab === "today"
        ? "No hay citas registradas para hoy."
        : activeTab === "upcoming"
          ? "No hay próximas citas programadas."
          : "No tienes citas atendidas registradas."}
    </p>
  </div>
);

export default AppointmentTabs;
