import { useState } from "react";
import Icon from "../../../components/ui/misc/AppIcon";

const SharedCalendarList = ({ onCalendarToggle }) => {
  const [calendars, setCalendars] = useState([
    {
      id: 1,
      name: "Meu Calendário",
      owner: "Você",
      color: "#3B82F6",
      visible: true,
      type: "personal",
    },
    {
      id: 2,
      name: "Calendário da Equipe",
      owner: "Equipe de Desenvolvimento",
      color: "#10B981",
      visible: true,
      type: "team",
    },
    {
      id: 3,
      name: "Reuniões da Empresa",
      owner: "RH",
      color: "#F59E0B",
      visible: false,
      type: "company",
    },
  ]);

  const toggleCalendar = (calendarId) => {
    setCalendars((prev) =>
      prev?.map((cal) =>
        cal?.id === calendarId ? { ...cal, visible: !cal?.visible } : cal,
      ),
    );
    onCalendarToggle?.(calendarId);
  };

  const getCalendarIcon = (type) => {
    switch (type) {
      case "personal":
        return "User";
      case "team":
        return "Users";
      case "company":
        return "Building";
      default:
        return "Calendar";
    }
  };

  return (
    <div className="bg-card border border-hairline rounded-modern p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary">Calendários</h3>
        <button className="p-1 hover:bg-muted rounded-modern transition-micro">
          <Icon name="Plus" size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {calendars?.map((calendar) => (
          <div
            key={calendar?.id}
            className="flex items-center space-x-3 p-2 hover:bg-muted rounded-modern transition-micro group"
          >
            <button
              onClick={() => toggleCalendar(calendar?.id)}
              className="shrink-0"
            >
              <div
                className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-micro ${
                  calendar?.visible
                    ? "border-primary bg-primary"
                    : "border-hairline hover:border-primary"
                }`}
                style={{
                  backgroundColor: calendar?.visible
                    ? calendar?.color
                    : "transparent",
                  borderColor: calendar?.color,
                }}
              >
                {calendar?.visible && (
                  <Icon name="Check" size={12} color="white" />
                )}
              </div>
            </button>

            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Icon
                name={getCalendarIcon(calendar?.type)}
                size={16}
                className="text-text-secondary shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {calendar?.name}
                </div>
                <div className="text-xs text-text-secondary truncate">
                  {calendar?.owner}
                </div>
              </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded-modern transition-micro">
              <Icon name="MoreVertical" size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-hairline">
        <button className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-modern transition-micro">
          <Icon name="Plus" size={16} />
          <span>Adicionar Calendário</span>
        </button>
      </div>
    </div>
  );
};

export default SharedCalendarList;
