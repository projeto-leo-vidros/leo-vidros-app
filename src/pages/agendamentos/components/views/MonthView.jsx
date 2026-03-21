import { format, addDays, startOfWeek, endOfMonth, isToday, startOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay } from "date-fns";
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-7 bg-white border-b border-gray-200 shrink-0">
        {weekDaysNames.map((w) => (
          <div
            key={w}
            className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-widest"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-gray-200 overflow-hidden">
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
              className={`relative flex flex-col p-1.5 group transition-colors border-gray-200 overflow-hidden ${isPast ? "bg-gray-100/50 cursor-not-allowed opacity-90" : isCurrent ? "bg-white hover:bg-gray-50 cursor-pointer" : "bg-gray-100/80 opacity-50 cursor-pointer"}`}
              onClick={() => !isPast && onDateClick?.(day)}
            >
              <div className="flex justify-between items-start mb-1 shrink-0">
                <div className="relative">
                  <span
                    className={`text-xs w-6 h-6 flex items-center justify-center rounded-lg ${isCurrentToday ? "bg-[#134074ff] text-white font-bold text-center shadow-md" : "text-gray-700 font-semibold"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && !isCurrentToday && (
                    <div className="absoluterelative flex flex-col p-1.5 group transition-colors border-gray-200 overflow-hidden bg-gray-100/80 opacity-50 cursor-pointer -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                {!isPast && (
                  <button
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full p-1 transition"
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
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {dayEvents.slice(0, 4).map((evt, index) => (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-90 transition border-l-2 shadow-sm"
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
                  <div className="text-[9px] text-gray-500 font-bold text-center pt-0.5">
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
