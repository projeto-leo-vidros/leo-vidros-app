import { useMemo } from "react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Calendar as CalendarIcon, MapPin, User} from "lucide-react";
import { getBadgeColor } from "../../utils/eventHelpers";

const ListView = ({ events = [], onEventClick }) => {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA - dateB;
    });
  }, [events]);

  const groupedEvents = useMemo(() => {
    const groups = {};
    sortedEvents.forEach(event => {
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
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 h-full">
        <CalendarIcon className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">Nenhum agendamento encontrado.</p>
        <p className="text-sm">Os agendamentos cadastrados aparecerão aqui em formato de lista.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 h-full scrollbar-thin scrollbar-thumb-gray-200">
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => {
          const dateObj = parseISO((dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`));
          const isPast = isBefore(dateObj, startOfDay(new Date()));
          
          return (
            <div key={dateStr} className={`space-y-4 ${isPast ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-gray-50/95 backdrop-blur-sm py-2 px-1 border-b border-gray-200">
                <div className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg p-2 min-w-[60px] shadow-sm">
                  <span className="text-xs font-bold text-gray-500 uppercase">{format(dateObj, "MMM", { locale: ptBR })}</span>
                  <span className="text-xl font-black text-[#134074ff]">{format(dateObj, "dd")}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {format(dateObj, "EEEE", { locale: ptBR })}
                  </h3>
                  <p className="text-xs font-medium text-gray-500">
                    {dayEvents.length} {dayEvents.length === 1 ? 'agendamento' : 'agendamentos'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pl-4 sm:pl-16">
                {dayEvents.map(event => {
                  const badgeColor = getBadgeColor(event.tipoAgendamento);
                  const isCompleted = event.statusAgendamento?.nome === "CONCLUIDO" || event.statusAgendamento?.nome === "CANCELADO";
                  
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={`flex flex-col sm:flex-row gap-4 bg-white border ${isCompleted ? 'border-gray-200 bg-gray-50' : 'border-gray-200'} p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer`}
                    >
                      <div className="flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 shrink-0 sm:w-24">
                        <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                          <Clock className="w-4 h-4 text-[#134074ff]" />
                          {event.startTime}
                        </div>
                        {event.endTime && (
                          <div className="text-xs text-gray-500 font-medium ml-5 sm:ml-0 flex items-center gap-1">
                            até {event.endTime}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h4 className={`text-base font-bold ${isCompleted ? 'text-gray-600 line-through decoration-gray-400' : 'text-gray-900'} truncate`}>
                            {event.fullTitle}
                          </h4>
                          {event.statusAgendamento && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gray-100 text-gray-600">
                              {event.statusAgendamento.nome}
                            </span>
                          )}
                        </div>

                        {event.funcionarios && event.funcionarios.length > 0 && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-2">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">{event.funcionarios.map(f => f.nome).join(', ')}</span>
                          </div>
                        )}

                        {event.endereco && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">
                              {[event.endereco.rua, event.endereco.numero, event.endereco.bairro].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start shrink-0">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
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
