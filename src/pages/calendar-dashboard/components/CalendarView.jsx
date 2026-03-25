import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  isToday,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Loader2,
  AlertTriangle,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useEventDetails,
  useDeleteAgendamento,
  useEventsByDate,
} from "../hooks/useCalendarEvents";
import {
  getBadgeColor,
  formatAddress,
  getPedidoLabel,
  getEventDate,
} from "../utils/eventHelpers";
import {
  EventHeader,
  EventInfo,
  EventTeam,
  EventObservations,
  EventFooter,
  LoadingState,
  ErrorMessage,
} from "./EventModalComponents";
import EditarAgendamentoSimples from "../../pedidos/components/EditarAgendamentoSimples";
import Button from "../../../components/ui/Button/Button.component";

// --- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ---
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Cancelar Agendamento?
                </h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Esta ação é irreversível e removerá o agendamento
                permanentemente.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Voltar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={onConfirm}
                  disabled={isDeleting}
                  startIcon={
                    isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null
                  }
                >
                  {isDeleting ? "Cancelando..." : "Sim, cancelar"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- MODAL DE DETALHES DO EVENTO ---
const EventDetailsModal = ({
  initialEvent,
  onClose,
  onGeoLocationClick,
  onEventDeleted,
  onEdit,
}) => {
  const { details, loading, error } = useEventDetails(initialEvent);

  const onDeleteSuccess = (id) => {
    onEventDeleted?.(id);
    onClose?.();
  };

  const { deleteAgendamento, deleting } = useDeleteAgendamento(onDeleteSuccess);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteClick = () => setIsDeleteModalOpen(true);

  const handleConfirmDelete = async () => {
    const success = await deleteAgendamento(details.id);
    if (success) {
      setIsDeleteModalOpen(false);
    }
  };

  if (!details) return null;

  const badges = [];
  if (details.tipoAgendamento) {
    badges.push({
      label:
        details.tipoAgendamento?.label ||
        details.tipoAgendamento ||
        "Agendamento",
      className: getBadgeColor(details.tipoAgendamento),
    });
  }
  if (details.statusAgendamento) {
    badges.push({
      label: `✓ ${details.statusAgendamento.nome || details.statusAgendamento}`,
      className: "bg-green-50 text-green-700 border-green-200",
    });
  }

  const formattedDate = details.dataAgendamento
    ? format(
        parseISO(
          details.dataAgendamento.includes("T")
            ? details.dataAgendamento
            : `${details.dataAgendamento}T00:00:00`,
        ),
        "dd 'de' MMMM 'de' yyyy",
        { locale: ptBR },
      )
    : "—";

  return (
    <>
      <AnimatePresence>
        {details && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <div className="flex items-start justify-center min-h-screen pt-20 pb-10 px-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <EventHeader
                  title={details.title}
                  badges={badges}
                  onClose={onClose}
                />

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="p-6 space-y-6">
                    {loading ? (
                      <LoadingState />
                    ) : (
                      <>
                        <ErrorMessage message={error} />
                        <EventInfo
                          date={formattedDate}
                          startTime={details.startTime}
                          endTime={details.endTime}
                          servico={details.servico}
                          endereco={details.endereco}
                          produtos={details.produtos}
                        />
                        <EventTeam funcionarios={details.funcionarios} />
                        <EventObservations observacao={details.observacao} />
                      </>
                    )}
                  </div>
                </div>

                <EventFooter
                  onDelete={handleDeleteClick}
                  onViewMap={() => onGeoLocationClick?.(details.endereco)}
                  onEdit={() => onEdit?.(details)}
                  isDeleting={deleting}
                  isLoading={loading}
                  hasAddress={!!details.endereco}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleting}
      />
    </>
  );
};

const calculateEventStyle = (
  startTime,
  endTime,
  startHour = 7,
  pixelsPerHour = 70,
) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = (startH - startHour) * 60 + startM;
  const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
  const pixelsPerMinute = pixelsPerHour / 60;

  return {
    top: `${Math.max(0, startMinutes * pixelsPerMinute)}px`,
    height: `${Math.max(20, durationMinutes * pixelsPerMinute)}px`,
  };
};

const calculateEventLayout = (events) => {
  if (!events || events.length === 0) return [];
  const validEvents = events.filter(
    (event) =>
      event.startTime &&
      event.endTime &&
      typeof event.startTime === "string" &&
      typeof event.endTime === "string" &&
      event.startTime.includes(":") &&
      event.endTime.includes(":"),
  );
  if (validEvents.length === 0) return [];
  const sortedEvents = [...validEvents].sort((a, b) => {
    const [aH, aM] = a.startTime.split(":").map(Number);
    const [bH, bM] = b.startTime.split(":").map(Number);
    return aH * 60 + aM - (bH * 60 + bM);
  });
  const eventsWithLayout = [];
  const columns = [];
  sortedEvents.forEach((event) => {
    const [startH, startM] = event.startTime.split(":").map(Number);
    const [endH, endM] = event.endTime.split(":").map(Number);
    const eventStart = startH * 60 + startM;
    const eventEnd = endH * 60 + endM;
    let columnIndex = 0;
    while (columnIndex < columns.length) {
      const lastEventInColumn = columns[columnIndex];
      if (!lastEventInColumn || !lastEventInColumn.endTime) {
        break;
      }
      const [lastEndH, lastEndM] = lastEventInColumn.endTime
        .split(":")
        .map(Number);
      const lastEnd = lastEndH * 60 + lastEndM;
      if (eventStart >= lastEnd) break;
      columnIndex++;
    }
    if (columnIndex === columns.length) columns.push(event);
    else columns[columnIndex] = event;
    const overlappingColumns = columns.filter((col) => {
      if (!col || !col.startTime || !col.endTime) return false;
      const [colStartH, colStartM] = col.startTime.split(":").map(Number);
      const [colEndH, colEndM] = col.endTime.split(":").map(Number);
      const colStart = colStartH * 60 + colStartM;
      const colEnd = colEndH * 60 + colEndM;
      return !(eventEnd <= colStart || eventStart >= colEnd);
    }).length;
    eventsWithLayout.push({
      ...event,
      column: columnIndex,
      totalColumns: Math.max(overlappingColumns, columnIndex + 1),
    });
  });
  return eventsWithLayout;
};

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
          const hasEvents = dayEvents.length > 0;
          return (
            <div
              key={dateKey}
              className={`relative flex flex-col p-1.5 group transition-colors border-gray-200 overflow-hidden cursor-pointer ${isCurrent ? "bg-white hover:bg-gray-50" : "bg-gray-100/80 opacity-50"}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className="flex justify-between items-start mb-1 shrink-0">
                <div className="relative">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-lg ${isCurrentToday ? "bg-blue-600 text-white shadow-md" : "text-gray-700"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && !isCurrentToday && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </div>
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

const WeekView = ({
  currentDate,
  timeSlots,
  events,
  onEventClick,
  onTimeSlotClick,
}) => {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(start, i));
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
      <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-200 bg-white shrink-0">
        <div className="border-r border-gray-100"></div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`py-3 text-center border-r border-gray-100 flex flex-col items-center justify-center ${isToday(day) ? "bg-blue-50/30" : ""}`}
          >
            <div
              className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday(day) ? "text-blue-600" : "text-gray-400"}`}
            >
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div
              className={`text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full ${isToday(day) ? "bg-blue-600 text-white" : "text-gray-900"}`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] relative min-h-[1000px]">
          <div className="flex flex-col border-r border-gray-100 bg-white sticky left-0 z-10">
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
    if (!isToday(currentDay)) return false;
    const [hours] = timeSlot.split(":").map(Number);
    return hours < currentTime.getHours();
  };
  const currentTimePos = getCurrentTimePosition();
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-[100px_1fr] border-b border-gray-200 bg-white py-4 shrink-0">
        <div className="text-center text-gray-400 text-xs font-bold uppercase tracking-widest pt-2">
          Horário
        </div>
        <div className="pl-6">
          <div className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">
            {format(currentDay, "EEEE", { locale: ptBR })}
          </div>
          <div className="text-2xl font-normal text-gray-900">
            {format(currentDay, "d 'de' MMMM", { locale: ptBR })}
          </div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-[100px_1fr] relative">
          <div className="border-r border-gray-100 bg-white">
            {timeSlots.map((t) => (
              <div
                key={t}
                className="h-20 border-b border-gray-50 text-sm text-gray-500 font-medium text-center pt-3"
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

// --- COMPONENTE PRINCIPAL (CALENDAR VIEW) ---
const CalendarView = ({
  selectedDate,
  onDateSelect,
  onEventCreate,
  events = [],
  onEventDeleted,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [viewType, setViewType] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 7; h < 24; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const handlePrev = () => {
    setCurrentDate((d) =>
      viewType === "month"
        ? addMonths(d, -1)
        : addDays(d, viewType === "week" ? -7 : -1),
    );
  };

  const handleNext = () => {
    setCurrentDate((d) =>
      viewType === "month"
        ? addMonths(d, 1)
        : addDays(d, viewType === "week" ? 7 : 1),
    );
  };

  const handleTodayClick = () => setCurrentDate(new Date());
  const handleViewChange = (type) => setViewType(type);

  const renderHeaderTitle = () => {
    if (viewType === "month")
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    if (viewType === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
      const end = addDays(start, 4); // Sexta-feira (4 dias depois da segunda)
      return `${format(start, "d MMM", { locale: ptBR })} - ${format(end, "d MMM", { locale: ptBR })}`;
    }
    if (viewType === "day")
      return format(currentDate, "d 'de' MMMM yyyy", { locale: ptBR });
    return "";
  };

  const handleDayClick = (day) => {
    setCurrentDate(day);
    onDateSelect?.(day);
    onEventCreate?.({
      eventDate: format(day, "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
    });
  };

  const handleTimeSlotClick = (day, time) => {
    setCurrentDate(day);
    onDateSelect?.(day);
    onEventCreate?.({
      eventDate: format(day, "yyyy-MM-dd"),
      startTime: time,
      endTime: "",
    });
  };

  const handleEventClick = (evt) => {
    setSelectedEvent(evt);
  };

  const handleCreateClick = () => {
    onEventCreate?.({
      eventDate: format(currentDate, "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
    });
  };

  // --- NOVA FUNÇÃO DE EDIÇÃO ---
  const handleEditEvent = (eventDetails) => {
    // Fecha o modal de detalhes
    setSelectedEvent(null);

    // Abre o modal simples de edição
    setEditingEvent(eventDetails);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // Fecha o modal de edição
    setShowEditModal(false);
    setEditingEvent(null);

    // Notifica que o evento foi deletado/atualizado para recarregar
    if (onEventDeleted) {
      onEventDeleted();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-full flex flex-col bg-white border border-gray-200 relative overflow-hidden"
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
            <button
              onClick={handlePrev}
              className="p-1.5 cursor-pointer hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 cursor-pointer hover:bg-white hover:shadow-sm rounded-md text-gray-600 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 capitalize tracking-tight">
              {renderHeaderTitle()}
            </h2>
            <button
              onClick={handleTodayClick}
              className="px-4 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 cursor-pointer hover:bg-blue-100 border border-blue-100 rounded-full transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
        <div className="flex items-center gap-7 bg-white p-1">
          <Button
            variant="primary"
            onClick={handleCreateClick}
            startIcon={<Plus size={18} className="shrink-0" />}
          >
            <span className="hidden md:inline">Nova Tarefa</span>
          </Button>
          <div className="w-px h-6 bg-gray-300 mx-2 sm:mx-4"></div>

          <div className="flex items-center gap-0 bg-white p-1 rounded-lg border border-gray-300 shadow-sm">
            {["day", "week", "month"].map((type) => (
              <button
                key={type}
                onClick={() => handleViewChange(type)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-all ${
                  viewType === type
                    ? "bg-[#007EA7] text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <CalendarIcon size={18} />
                {{ day: "Dia", week: "Semana", month: "Mês" }[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewType === "day" && (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <DayView
                currentDay={currentDate}
                timeSlots={timeSlots}
                events={events}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </motion.div>
          )}
          {viewType === "week" && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <WeekView
                currentDate={currentDate}
                timeSlots={timeSlots}
                events={events}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </motion.div>
          )}
          {viewType === "month" && (
            <motion.div
              key="month"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <MonthView
                currentMonth={currentDate}
                events={events}
                onDateClick={handleDayClick}
                onEventClick={handleEventClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <EventDetailsModal
            initialEvent={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onGeoLocationClick={(endereco) => {
              if (!endereco) return;
              const addressParts = [
                endereco.rua,
                endereco.numero,
                endereco.complemento,
                endereco.bairro,
                endereco.cidade,
                endereco.uf,
                endereco.cep,
              ].filter(Boolean);
              navigate("/geo-localizacao", {
                state: { address: addressParts.join(", ") },
              });
            }}
            onEventDeleted={onEventDeleted}
            onEdit={handleEditEvent}
          />
        )}
      </AnimatePresence>

      {/* Modal de Edição Simples */}
      <EditarAgendamentoSimples
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        agendamento={editingEvent}
        onSuccess={handleEditSuccess}
      />
    </motion.div>
  );
};

export default CalendarView;
