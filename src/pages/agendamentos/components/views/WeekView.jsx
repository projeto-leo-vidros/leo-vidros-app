import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, addDays, startOfWeek, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { getEventDate } from "../../utils/eventHelpers";

const toSoftAccent = (color) => {
  if (!color || typeof color !== "string") return "#94a3b8";

  const normalized = color.trim();
  const shortHexMatch = normalized.match(/^#([0-9a-fA-F]{3})$/);
  const fullHexMatch = normalized.match(/^#([0-9a-fA-F]{6})$/);

  const parseHex = (hex) => {
    const safeHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const r = Number.parseInt(safeHex.slice(0, 2), 16);
    const g = Number.parseInt(safeHex.slice(2, 4), 16);
    const b = Number.parseInt(safeHex.slice(4, 6), 16);
    return Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)
      ? "#94a3b8"
      : `rgba(${r}, ${g}, ${b}, 0.45)`;
  };

  if (shortHexMatch) return parseHex(shortHexMatch[1]);
  if (fullHexMatch) return parseHex(fullHexMatch[1]);

  if (normalized.startsWith("rgb(")) {
    return normalized.replace("rgb(", "rgba(").replace(/\)\s*$/, ", 0.45)");
  }

  return normalized;
};

const WeekView = ({
  currentDate,
  timeSlots,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date();
      const hours = now.getHours();
      if (hours >= 7 && hours < 24) {
        const slotIndex = hours - 7;
        const scrollPosition = slotIndex * 70 - 150;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, []);
  const getCurrentTimePosition = useCallback(() => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 7 || hours >= 24) return null;
    const slotIndex = hours - 7;
    const minutePercent = minutes / 60;
    return (slotIndex + minutePercent) * 70;
  }, [currentTime]);
  const isTimeSlotPast = useCallback(
    (timeSlot, day) => {
      if (isBefore(startOfDay(day), startOfDay(currentTime))) return true;
      if (!isToday(day)) return false;
      const [hours] = timeSlot.split(":").map(Number);
      const now = currentTime;
      return hours < now.getHours();
    },
    [currentTime],
  );
  const eventsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      grouped[key] =
        events?.filter((e) => {
          const eventDateKey = getEventDate(e);
          return eventDateKey === key;
        }) || [];
    });
    return grouped;
  }, [events, weekDays]);
  const getEventsForDay = useCallback(
    (day) => {
      const key = format(day, "yyyy-MM-dd");
      return eventsByDay[key] || [];
    },
    [eventsByDay],
  );
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="overflow-x-auto">
      <div className="grid grid-cols-[60px_repeat(7,minmax(80px,1fr))] sm:grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-white shrink-0 min-w-[560px]">
        <div className="border-r border-gray-100"></div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`py-3 text-center border-r border-gray-100 flex flex-col items-center justify-center ${isToday(day) ? "bg-blue-50/30" : ""}`}
          >
            <div
              className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${isToday(day) ? "text-blue-600" : "text-gray-400"}`}
            >
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div
              className={`text-lg sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full ${isToday(day) ? "bg-blue-600 text-white" : "text-gray-900"}`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-auto">
        <div className="grid grid-cols-[60px_repeat(7,minmax(80px,1fr))] sm:grid-cols-[80px_repeat(7,1fr)] relative min-h-[1000px] min-w-[560px]">
          <div className="flex flex-col border-r border-gray-100 bg-white sticky left-0 z-10 min-w-[60px] sm:min-w-[80px]">
            {timeSlots.map((t) => (
              <div
                key={t}
                className="h-[70px] border-b border-gray-50 text-xs text-gray-400 font-medium text-right pr-3 pt-2"
              >
                {t}
              </div>
            ))}
          </div>
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const sortedDayEvents = [...dayEvents].sort((a, b) =>
              String(a.startTime || a.inicioAgendamento || "").localeCompare(
                String(b.startTime || b.inicioAgendamento || ""),
              ),
            );
            const isLowDensity = sortedDayEvents.length <= 2;
            const eventRowHeightClass =
              sortedDayEvents.length <= 2
                ? "h-[36px]"
                : sortedDayEvents.length <= 4
                  ? "h-[32px]"
                  : "h-[28px]";
            const eventWidthClass =
              sortedDayEvents.length <= 2
                ? "w-[86%] max-w-[300px]"
                : "w-[92%]";
            const timeTextClass =
              sortedDayEvents.length <= 2 ? "text-[11px]" : "text-[10px]";
            const titleTextClass =
              sortedDayEvents.length <= 2 ? "text-[13px]" : "text-[11px]";
            const currentTimePos = isToday(day)
              ? getCurrentTimePosition()
              : null;
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col relative border-r border-gray-100 bg-white"
              >
                {timeSlots.map((t) => {
                  const isPast = isTimeSlotPast(t, day);
                  return (
                    <div
                      key={t}
                      className={`h-[70px] border-b border-gray-50 transition-all ${isPast ? "bg-gray-200/60 opacity-40 cursor-not-allowed" : "hover:bg-gray-50/50 cursor-pointer"}`}
                      onClick={() => !isPast && onTimeSlotClick?.(day, t)}
                    />
                  );
                })}
                {currentTimePos !== null && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: `${currentTimePos}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg"></div>
                      <div className="flex-1 h-0.5 bg-blue-500 shadow-sm"></div>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 z-20 p-1">
                  <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex h-full flex-col gap-1 overflow-y-auto pr-0.5">
                    {sortedDayEvents.map((evt, index) => {
                      const accentColor = toSoftAccent(
                        evt.backgroundColor || evt.color || "#3b82f6",
                      );
                      return (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.04 }}
                          className={`flex ${eventRowHeightClass} ${eventWidthClass} justify-self-center rounded-md border border-gray-200 bg-white/90 px-1.5 py-0.5 shadow-sm transition hover:border-gray-300 hover:bg-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(evt);
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {isLowDensity ? (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-center">
                              <span
                                className={`w-full truncate ${titleTextClass} font-bold text-gray-700`}
                                title={evt.title || "Evento"}
                              >
                                {evt.title || "Evento"}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: accentColor }}
                                />
                                <span className={`${timeTextClass} font-semibold text-gray-600`}>
                                  {evt.startTime || evt.inicioAgendamento || "--:--"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full w-full items-center gap-1.5">
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                              <span className={`${timeTextClass} shrink-0 font-semibold text-gray-600`}>
                                {evt.startTime || evt.inicioAgendamento || "--:--"}
                              </span>
                              <span
                                className={`truncate ${titleTextClass} font-semibold text-gray-700`}
                                title={evt.title || "Evento"}
                              >
                                {evt.title || "Evento"}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
