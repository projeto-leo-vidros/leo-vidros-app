import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { format, addDays, startOfWeek, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getEventDate } from "../../utils/eventHelpers";
import { calculateEventStyle, calculateEventLayout } from "../../utils/calendarUtils";

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
            const eventsWithLayout = calculateEventLayout(dayEvents);
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
                <div className="absolute inset-0 p-1 pointer-events-none">
                  {eventsWithLayout.map((evt, index) => {
                    const eventStyle = calculateEventStyle(
                      evt.startTime,
                      evt.endTime,
                    );
                    const widthPercent = 100 / evt.totalColumns;
                    const leftPercent = evt.column * widthPercent;
                    return (
                      <motion.div
                        key={evt.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="absolute rounded-md px-2 py-1 shadow-sm border-l-4 cursor-pointer text-[11px] leading-tight overflow-hidden hover:z-20 hover:shadow-md transition-all pointer-events-auto"
                        style={{
                          ...eventStyle,
                          left: `calc(${leftPercent}% + 4px)`,
                          width: `calc(${widthPercent}% - 8px)`,
                          borderLeftColor: evt.backgroundColor || "#3b82f6",
                          backgroundColor: `${evt.backgroundColor || "#3b82f6"}20`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(evt);
                        }}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="font-semibold truncate text-gray-900">
                          {evt.title || "Evento"}
                        </div>
                        <div className="opacity-70 text-gray-700">
                          {evt.startTime} - {evt.endTime}
                        </div>
                      </motion.div>
                    );
                  })}
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
