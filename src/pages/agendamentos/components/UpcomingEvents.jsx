import { format, addDays, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Icon from "../../../components/ui/misc/AppIcon";

const UpcomingEvents = ({ events = [] }) => {
  // Filtrar e ordenar eventos futuros (próximos 7 dias)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = addDays(today, 7);

    return events
      .filter((event) => {
        try {
          const eventDate = parseISO(event.date); // espera formato YYYY-MM-DD
          return eventDate >= today && eventDate <= sevenDaysLater;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        // Se mesma data, ordena por hora de início
        return (a.startTime || "").localeCompare(b.startTime || "");
      });
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "SERVICO":
        return "Code";
      case "ORCAMENTO":
        return "Briefcase";
      default:
        return "Calendar";
    }
  };

  const getPriorityColor = (status) => {
    // Baseado no statusAgendamento do backend
    if (status?.nome === "PENDENTE") return "border-l-warning";
    if (status?.nome === "CONFIRMADO") return "border-l-success";
    if (status?.nome === "CANCELADO") return "border-l-error";
    return "border-l-muted";
  };

  const getDateLabel = (dateStr) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) {
        return "Hoje";
      } else if (isTomorrow(date)) {
        return "Amanhã";
      } else {
        return format(date, "dd/MM", { locale: ptBR });
      }
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "–";
    try {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
      if (minutes < 0) minutes += 24 * 60; // próximo dia

      if (minutes < 60) {
        return `${minutes}min`;
      }
      const hours = Math.floor(minutes / 60);
      const remaining = minutes % 60;
      return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
    } catch {
      return "–";
    }
  };

  const upcomingEvents = getUpcomingEvents();

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary">Próximos Eventos</h3>
        </div>
        <div className="text-center py-8 text-text-secondary text-sm">
          Nenhum evento nos próximos 7 dias
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">Próximos Eventos</h3>
        <span className="text-xs text-text-secondary bg-muted px-2 py-1 rounded-modern">
          {upcomingEvents.length}
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {upcomingEvents?.map((event) => (
          <div
            key={event?.id}
            className={`bg-card border border-hairline rounded-modern p-3 hover:shadow-soft transition-micro cursor-pointer group border-l-4 ${getPriorityColor(event?.statusAgendamento)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 bg-muted rounded-modern flex items-center justify-center">
                  <Icon
                    name={getEventIcon(event?.tipoAgendamento)}
                    size={16}
                    className="text-text-secondary"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-text-primary truncate">
                    {event?.title || event?.tipoAgendamento}
                  </h4>
                  <span className="text-xs text-text-secondary shrink-0 ml-2">
                    {getDateLabel(event?.date)}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-text-secondary mb-2">
                  <div className="flex items-center space-x-1">
                    <Icon name="Clock" size={12} />
                    <span>{event?.startTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon name="Timer" size={12} />
                    <span>
                      {calculateDuration(event?.startTime, event?.endTime)}
                    </span>
                  </div>
                </div>

                {event?.endereco?.rua && (
                  <div className="flex items-center space-x-1 text-xs text-text-secondary mb-2">
                    <Icon name="MapPin" size={12} />
                    <span className="truncate">
                      {event?.endereco?.rua}, {event?.endereco?.numero}
                    </span>
                  </div>
                )}

                {event?.funcionarios?.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-text-secondary">
                    <Icon name="Users" size={12} />
                    <span className="truncate">
                      {event?.funcionarios?.slice(0, 2)?.join(", ")}
                      {event?.funcionarios?.length > 2 &&
                        ` +${event?.funcionarios?.length - 2}`}
                    </span>
                  </div>
                )}
              </div>

              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded-modern transition-micro">
                <Icon name="MoreVertical" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-hairline">
        <button className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-modern transition-micro">
          <Icon name="Calendar" size={16} />
          <span>Ver Calendário Completo</span>
        </button>
      </div>
    </div>
  );
};

export default UpcomingEvents;
