import { useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, MapPin, User } from "lucide-react";
import { getBadgeColor } from "../../utils/eventHelpers";

const ListView = ({ events = [], onEventClick }) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const datePartA = String(a.date).split("T")[0];
      const datePartB = String(b.date).split("T")[0];
      const dateA = new Date(`${datePartA}T${a.startTime}`);
      const dateB = new Date(`${datePartB}T${b.startTime}`);
      return dateA - dateB;
    });
  }, [events]);

  const groupedEvents = useMemo(() => {
    const groups = {};
    sortedEvents.forEach((event) => {
      const dateStr = event.date; // format yyyy-MM-dd
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(event);
    });
    return groups;
  }, [sortedEvents]);

  if (sortedEvents.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-gray-500">
        <CalendarIcon className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-lg font-medium">Nenhum agendamento encontrado.</p>
        <p className="text-sm">
          Os agendamentos cadastrados aparecerão aqui em formato de lista.
        </p>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin scrollbar-thumb-gray-200 h-full flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-8 pb-10">
        {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
          const dateObj = parseISO(
            dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`,
          );
          const isPast = isBefore(dateObj, startOfDay(new Date()));

          return (
            <div
              key={dateStr}
              className={`space-y-4 ${isPast ? "opacity-70 grayscale-[0.3]" : ""}`}
            >
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-gray-50/95 px-1 py-2 backdrop-blur-sm">
                <div className="flex min-w-[60px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  <span className="text-xs font-bold text-gray-500 uppercase">
                    {format(dateObj, "MMM", { locale: ptBR })}
                  </span>
                  <span className="text-xl font-black text-[#134074ff]">
                    {format(dateObj, "dd")}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {format(dateObj, "EEEE", { locale: ptBR })}
                  </h3>
                  <p className="text-xs font-medium text-gray-500">
                    {dayEvents.length}{" "}
                    {dayEvents.length === 1 ? "agendamento" : "agendamentos"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pl-4 sm:pl-16">
                {dayEvents.map((event) => {
                  const badgeColor = getBadgeColor(event.tipoAgendamento);
                  const isCompleted =
                    event.statusAgendamento?.nome === "CONCLUIDO" ||
                    event.statusAgendamento?.nome === "CANCELADO";

                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`flex flex-col gap-4 border bg-white sm:flex-row ${isCompleted ? "border-gray-200 bg-gray-50" : "border-gray-200"} cursor-pointer rounded-xl p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md`}
                    >
                      <div className="flex shrink-0 items-center gap-2 sm:w-24 sm:flex-col sm:items-start sm:gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <Clock className="h-4 w-4 text-[#134074ff]" />
                          {event.startTime}
                        </div>
                        {event.endTime && (
                          <div className="ml-5 flex items-center gap-1 text-xs font-medium text-gray-500 sm:ml-0">
                            até {event.endTime}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                          <h4
                            className={`text-base font-bold ${isCompleted ? "text-gray-600 line-through decoration-gray-400" : "text-gray-900"} truncate`}
                          >
                            {event.fullTitle}
                          </h4>
                          {event.statusAgendamento && (
                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                              {event.statusAgendamento.nome}
                            </span>
                          )}
                        </div>

                        {event.funcionarios &&
                          event.funcionarios.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                              <User className="h-3.5 w-3.5" />
                              <span className="truncate">
                                {event.funcionarios
                                  .map((f) => f.nome)
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                        {event.endereco && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {[
                                event.endereco.rua,
                                event.endereco.numero,
                                event.endereco.bairro,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-start">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor}`}
                        >
                          {event.tipoAgendamento || "Agendamento"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListView;
