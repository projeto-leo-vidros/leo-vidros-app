import {
  format,
  addDays,
  startOfWeek,
  endOfMonth,
  isToday,
  startOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useEventsByDate } from "../../hooks/useCalendarEvents";

const MonthView = ({ currentMonth, events, onDateClick, onEventClick }) => {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = startOfWeek(addDays(endOfMonth(currentMonth), 6), {
    weekStartsOn: 0,
  });
  const days = eachDayOfInterval({ start, end });
  const { eventsByDate } = useEventsByDate(events);
  const weekDaysNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-7 border-b border-gray-200 bg-white">
        {weekDaysNames.map((w) => (
          <div
            key={w}
            className="py-2 text-center text-xs font-bold tracking-widest text-gray-400 uppercase"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-7 gap-px overflow-hidden bg-gray-200">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrent = isSameMonth(day, currentMonth);
          const isCurrentToday = isToday(day);
          const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
          const hasEvents = dayEvents.length > 0;
          return (
            <div
              key={dateKey}
              className={`group relative flex flex-col overflow-hidden border-gray-200 p-1.5 transition-colors ${isPast ? "cursor-not-allowed bg-gray-100/50 opacity-90" : isCurrent ? "cursor-pointer bg-white hover:bg-gray-50" : "cursor-pointer bg-gray-100/80 opacity-50"}`}
              onClick={() => !isPast && onDateClick?.(day)}
            >
              <div className="mb-1 flex shrink-0 items-start justify-between">
                <div className="relative">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${isCurrentToday ? "bg-[#134074ff] text-center font-bold text-white shadow-md" : "font-semibold text-gray-700"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && !isCurrentToday && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500"></div>
                  )}
                </div>
                {!isPast && (
                  <button
                    className="rounded-full p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick?.(day);
                    }}
                    title="Adicionar evento"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              <div className="custom-scrollbar flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto">
                {dayEvents.slice(0, 4).map((evt, index) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="cursor-pointer truncate rounded border-l-[3px] px-2 py-1 text-xs font-semibold shadow-sm transition hover:opacity-90"
                    style={{
                      backgroundColor: `${evt.backgroundColor || "#3b82f6"}15`,
                      borderLeftColor: evt.backgroundColor || "#3b82f6",
                      color: "#1f2937",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(evt);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="font-semibold">{evt.title}</span>
                  </motion.div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="pt-0.5 text-center text-[9px] font-bold text-gray-500">
                    + {dayEvents.length - 4} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
