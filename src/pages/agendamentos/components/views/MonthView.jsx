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
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useEventsByDate } from "../../hooks/useCalendarEvents";

const toMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== "string" || !timeValue.includes(":")) {
    return null;
  }
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const toSoftAccent = (color) => {
  if (!color || typeof color !== "string") {
    return "#94a3b8";
  }

  const normalized = color.trim();
  const shortHexMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
  const fullHexMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);

  const parseHex = (hex) => {
    const safeHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = Number.parseInt(safeHex.slice(0, 2), 16);
    const g = Number.parseInt(safeHex.slice(2, 4), 16);
    const b = Number.parseInt(safeHex.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)
      ? null
      : `rgba(${r}, ${g}, ${b}, 0.45)`;
  };

  if (shortHexMatch) {
    return parseHex(shortHexMatch[1]) || "#94a3b8";
  }

  if (fullHexMatch) {
    return parseHex(fullHexMatch[1]) || "#94a3b8";
  }

  if (normalized.startsWith("rgb")) {
    return normalized.replace(/\)\s*$/, ", 0.45)").replace("rgb(", "rgba(");
  }

  return normalized;
};

const getConflictInfo = (dayEvents) => {
  if (!Array.isArray(dayEvents) || dayEvents.length < 2) {
    return { conflictIds: new Set(), conflictPairs: 0 };
  }

  const conflictIds = new Set();
  let conflictPairs = 0;

  for (let i = 0; i < dayEvents.length; i++) {
    const current = dayEvents[i];
    const currentStart = toMinutes(current.startTime || current.inicioAgendamento);
    const currentEnd = toMinutes(current.endTime || current.fimAgendamento);

    if (currentStart == null || currentEnd == null || currentEnd <= currentStart) {
      continue;
    }

    for (let j = i + 1; j < dayEvents.length; j++) {
      const compared = dayEvents[j];
      const comparedStart = toMinutes(
        compared.startTime || compared.inicioAgendamento,
      );
      const comparedEnd = toMinutes(compared.endTime || compared.fimAgendamento);

      if (
        comparedStart == null ||
        comparedEnd == null ||
        comparedEnd <= comparedStart
      ) {
        continue;
      }

      const overlaps = currentStart < comparedEnd && comparedStart < currentEnd;
      if (!overlaps) continue;

      conflictPairs += 1;
      conflictIds.add(current.id);
      conflictIds.add(compared.id);
    }
  }

  return { conflictIds, conflictPairs };
};

const MonthView = ({
  currentMonth,
  events,
  onDateClick,
  onEventClick,
}) => {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = startOfWeek(addDays(endOfMonth(currentMonth), 6), {
    weekStartsOn: 0,
  });
  const days = eachDayOfInterval({ start, end });
  const weeksCount = Math.ceil(days.length / 7);
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
      <div
        className="grid flex-1 grid-cols-7 gap-px overflow-hidden bg-gray-200"
        style={{ gridTemplateRows: `repeat(${weeksCount}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = [...(eventsByDate[dateKey] || [])].sort((a, b) =>
            String(a.startTime || a.inicioAgendamento || "").localeCompare(
              String(b.startTime || b.inicioAgendamento || ""),
            ),
          );
          const isCurrent = isSameMonth(day, currentMonth);
          const isCurrentToday = isToday(day);
          const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
          const hasEvents = dayEvents.length > 0;
          const { conflictIds, conflictPairs } = getConflictInfo(dayEvents);
          const hasConflicts = conflictPairs > 0;
          const visibleEvents = dayEvents;
          const isLowDensity = dayEvents.length <= 2;
          const eventRowHeightClass =
            dayEvents.length <= 2
              ? "h-[36px]"
              : dayEvents.length <= 4
                ? "h-[32px]"
                : "h-[28px]";
          const eventWidthClass =
            dayEvents.length <= 2
              ? "w-[86%] max-w-[300px]"
              : "w-[92%]";
          const timeTextClass =
            dayEvents.length <= 2 ? "text-[11px]" : "text-[10px]";
          const titleTextClass =
            dayEvents.length <= 2 ? "text-[13px]" : "text-[11px]";
          return (
            <div
              key={dateKey}
              className={`group relative flex min-h-0 flex-col overflow-hidden border-gray-200 p-1.5 transition-colors ${isPast ? "cursor-not-allowed bg-gray-100/50 opacity-90" : isCurrent ? "cursor-pointer bg-white hover:bg-gray-50" : "cursor-pointer bg-gray-100/80 opacity-50"}`}
              onClick={() => !isPast && onDateClick?.(day)}
            >
              {!isPast && (
                <button
                  className="absolute top-1.5 right-1.5 rounded-full p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateClick?.(day);
                  }}
                  title="Adicionar evento"
                >
                  <Plus size={14} />
                </button>
              )}
              <div className="mb-1 flex shrink-0 items-start justify-between pr-6">
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
                {hasEvents && (
                  <div className="flex items-center gap-1">
                    {hasConflicts && (
                      <span
                        className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700"
                        title={`Conflitos de horario: ${conflictPairs}`}
                      >
                        ! {conflictPairs}
                      </span>
                    )}
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={`scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent grid flex-1 auto-rows-min gap-1 overflow-y-auto pr-0.5 ${isLowDensity ? "grid-cols-1" : "grid-cols-2"}`}
              >
                {visibleEvents.map((evt, index) => {
                  const isConflictingEvent = conflictIds.has(evt.id);
                  const accentColor = toSoftAccent(
                    evt.backgroundColor || evt.color || "#3b82f6",
                  );
                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex ${eventRowHeightClass} ${eventWidthClass} justify-self-center cursor-pointer rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition ${isLowDensity ? "flex-col items-center justify-center gap-0.5" : "items-center gap-1.5"} ${isConflictingEvent ? "border-red-200 bg-red-50/70 hover:border-red-300 hover:bg-red-50" : "border-gray-200 bg-white/85 hover:border-gray-300 hover:bg-white"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(evt);
                      }}
                      title={evt.fullTitle || evt.title}
                      whileHover={{ scale: 1.01 }}
                    >
                      {isLowDensity ? (
                        <>
                          <span
                            className={`w-full truncate text-center ${titleTextClass} font-bold ${isConflictingEvent ? "text-red-800" : "text-gray-700"}`}
                          >
                            {evt.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: accentColor }}
                            />
                            <span
                              className={`shrink-0 ${timeTextClass} font-semibold ${isConflictingEvent ? "text-red-700" : "text-gray-600"}`}
                            >
                              {evt.startTime || evt.inicioAgendamento || "--:--"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          />
                          <span
                            className={`shrink-0 ${timeTextClass} font-semibold ${isConflictingEvent ? "text-red-700" : "text-gray-600"}`}
                          >
                            {evt.startTime || evt.inicioAgendamento || "--:--"}
                          </span>
                          <span
                            className={`truncate ${titleTextClass} font-semibold ${isConflictingEvent ? "text-red-800" : "text-gray-700"}`}
                          >
                            {evt.title}
                          </span>
                        </>
                      )}
                    </motion.div>
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

export default MonthView;
