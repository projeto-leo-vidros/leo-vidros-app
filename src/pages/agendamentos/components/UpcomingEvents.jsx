import { useState } from "react";
import { format, addDays, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import Icon from "../../../components/ui/misc/AppIcon";
import { getEventDate, normalizeStatus } from "../utils/eventHelpers";

const UpcomingEvents = ({
  events = [],
  onViewEvent,
  onEditEvent,
  onViewCalendar,
}) => {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const getUpcomingEvents = () => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = addDays(today, 7);

    return events
      .filter((event) => {
        try {
          const statusNorm = normalizeStatus(event.statusAgendamento);
          if (statusNorm === "CANCELADO" || statusNorm === "CONCLUIDO") {
            return false;
          }

          const dateKey = getEventDate(event);
          if (!dateKey) return false;

          const eventDate = parseISO(`${dateKey}T00:00:00`);
          if (eventDate < today || eventDate > sevenDaysLater) {
            return false;
          }

          const [hours = 0, minutes = 0] = String(
            event.startTime || event.inicioAgendamento || "00:00",
          )
            .substring(0, 5)
            .split(":")
            .map(Number);

          const startDateTime = new Date(eventDate);
          startDateTime.setHours(hours, minutes, 0, 0);

          // Include events that haven't started yet OR are currently in progress
          const endTimeStr = event.endTime || event.fimAgendamento;
          if (startDateTime <= now && endTimeStr) {
            const [endH = 0, endM = 0] = String(endTimeStr)
              .substring(0, 5)
              .split(":")
              .map(Number);
            const endDateTime = new Date(eventDate);
            endDateTime.setHours(endH, endM, 0, 0);
            return endDateTime > now;
          }

          return startDateTime > now;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = parseISO(
          `${getEventDate(a) || String(a.date).split("T")[0]}T00:00:00`,
        );
        const dateB = parseISO(
          `${getEventDate(b) || String(b.date).split("T")[0]}T00:00:00`,
        );

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }

        return (a.startTime || a.inicioAgendamento || "").localeCompare(
          b.startTime || b.inicioAgendamento || "",
        );
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
        return "Amanha";
      } else {
        return format(date, "dd/MM", { locale: ptBR });
      }
    } catch {
      return dateStr;
    }
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "-";
    try {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);

      let minutes = endHour * 60 + endMin - (startHour * 60 + startMin);
      if (minutes < 0) minutes += 24 * 60;

      if (minutes < 60) {
        return `${minutes}min`;
      }
      const hours = Math.floor(minutes / 60);
      const remaining = minutes % 60;
      return remaining > 0 ? `${hours}h ${remaining}min` : `${hours}h`;
    } catch {
      return "-";
    }
  };

  const upcomingEvents = getUpcomingEvents();

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <div>
        <div className="py-8 text-center text-sm text-text-secondary">
          Nenhum evento nos proximos 7 dias
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {upcomingEvents?.map((event) => (
          <div
            key={event?.id}
            onClick={() => onViewEvent?.(event)}
            className={`bg-card group cursor-pointer rounded-modern border border-hairline border-l-4 p-3 transition-micro hover:shadow-soft ${getPriorityColor(event?.statusAgendamento)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-modern bg-muted">
                  <Icon
                    name={getEventIcon(event?.tipoAgendamento)}
                    size={16}
                    className="text-text-secondary"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h4 className="truncate text-sm font-medium text-text-primary">
                    {event?.title || event?.tipoAgendamento}
                  </h4>
                  <span className="ml-2 shrink-0 text-xs text-text-secondary">
                    {getDateLabel(event?.date)}
                  </span>
                </div>

                <div className="mb-2 flex items-center space-x-3 text-xs text-text-secondary">
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
                  <div className="mb-2 flex items-center space-x-1 text-xs text-text-secondary">
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
                      {event?.funcionarios
                        ?.slice(0, 2)
                        ?.map((f) => f.nome)
                        ?.join(", ")}
                      {event?.funcionarios?.length > 2 &&
                        ` +${event?.funcionarios?.length - 2}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(
                      openDropdownId === event.id ? null : event.id,
                    );
                  }}
                  className="rounded-modern p-1 text-gray-400 opacity-0 transition-micro hover:bg-muted hover:text-gray-800 group-hover:opacity-100"
                >
                  <Icon name="MoreVertical" size={14} />
                </button>
                {openDropdownId === event.id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(null);
                      }}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(null);
                          onEditEvent?.(event);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Icon name="Edit3" size={14} /> Editar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-hairline">
        <button
          onClick={onViewCalendar}
          className="flex w-full items-center justify-center gap-2 rounded-modern py-2 text-sm text-primary transition-micro hover:bg-primary/10"
        >
          <Icon name="Calendar" size={16} />
          <span>Ver Agenda Completa</span>
        </button>
      </div>
    </div>
  );
};

export default UpcomingEvents;
