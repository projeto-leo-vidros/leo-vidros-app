import { useState, useEffect, useRef } from "react";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { getEventDate } from "../../utils/eventHelpers";
import { calculateEventStyle, calculateEventLayout } from "../../utils/calendarUtils";

const DayView = ({
  currentDay,
  timeSlots,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const dayKey = format(currentDay, "yyyy-MM-dd");
  const dayEvents =
    events?.filter((e) => {
      const eventDateKey = getEventDate(e);
      return eventDateKey === dayKey;
    }) || [];
  const eventsWithLayout = calculateEventLayout(dayEvents);
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && isToday(currentDay)) {
      const now = new Date();
      const hours = now.getHours();
      if (hours >= 7 && hours < 24) {
        const slotIndex = hours - 7;
        const scrollPosition = slotIndex * 80 - 150;
        scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
      }
    }
  }, [currentDay]);
  const getCurrentTimePosition = () => {
    if (!isToday(currentDay)) return null;
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    if (hours < 7 || hours >= 24) return null;
    const slotIndex = hours - 7;
    const minutePercent = minutes / 60;
    return (slotIndex + minutePercent) * 80;
  };
  const isTimeSlotPast = (timeSlot) => {
    if (isBefore(startOfDay(currentDay), startOfDay(currentTime))) return true;
    if (!isToday(currentDay)) return false;
    const [hours] = timeSlot.split(":").map(Number);
    return hours < currentTime.getHours();
  };
  const currentTimePos = getCurrentTimePosition();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-[100px_1fr] border-b border-gray-200 bg-white py-4 shrink-0">
        <div className="flex items-end justify-center pb-1 text-gray-900 text-xs font-bold uppercase tracking-widest pl-3">
          Horário
        </div>
        <div className="pl-6">
          <div className="text-sm font-bold text-[#134074ff] uppercase tracking-widest mb-1">
            {format(currentDay, "EEEE", { locale: ptBR })}
          </div>
          <div className="text-2xl font-normal text-gray-900">
            {format(currentDay, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[100px_1fr] relative">
          <div className="border-r border-gray-100 bg-white">
            {timeSlots.map((t) => (
              <div
                key={t}
                className="h-20 border-b border-gray-50 text-sm text-gray-900 font-medium text-center pt-3"
              >
                {t}
              </div>
            ))}
          </div>
          <div className="relative bg-white">
            {timeSlots.map((t) => {
              const isPast = isTimeSlotPast(t);
              return (
                <div
                  key={t}
                  className={`h-20 border-b border-gray-50 relative transition-all ${isPast ? "bg-gray-200/60 opacity-40 cursor-not-allowed" : "hover:bg-gray-50/50 cursor-pointer"}`}
                  onClick={() => !isPast && onTimeSlotClick?.(currentDay, t)}
                >
                  <div className="absolute top-1/2 w-full border-t border-dotted border-gray-100 pointer-events-none" />
                </div>
              );
            })}{" "}
            {currentTimePos !== null && (
              <div
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${currentTimePos}px` }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg ml-2"></div>
                  <div className="flex-1 h-0.5 bg-blue-500 shadow-sm"></div>
                </div>
              </div>
            )}{" "}
            {eventsWithLayout?.map((evt, i) => {
              const eventStyle = calculateEventStyle(
                evt.startTime,
                evt.endTime,
                7,
                80,
              );
              const widthPercent = 100 / evt.totalColumns;
              const leftPercent = evt.column * widthPercent;
              return (
                <motion.div
                  key={evt.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="absolute rounded-md px-3 py-2 shadow-sm border-l-4 hover:shadow-md cursor-pointer overflow-hidden hover:z-20 transition-all"
                  style={{
                    ...eventStyle,
                    left: `calc(${leftPercent}% + 16px)`,
                    width: `calc(${widthPercent}% - 32px)`,
                    borderLeftColor: evt.backgroundColor || "#3b82f6",
                    backgroundColor: `${evt.backgroundColor || "#3b82f6"}20`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick?.(evt);
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {evt.title}
                  </div>
                  <div className="text-gray-600 text-xs flex items-center gap-1">
                    <Clock size={12} /> {evt.startTime} - {evt.endTime}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;
