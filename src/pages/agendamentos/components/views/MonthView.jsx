import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useEventsByDate } from "../../hooks/useCalendarEvents";

const MAX_VISIBLE_FULLSCREEN = 3;

const toMinutes = (timeValue) => {
  if (!timeValue || typeof timeValue !== "string" || !timeValue.includes(":")) {
    return null;
  }

  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const toAccentColor = (color) => {
  if (!color || typeof color !== "string") return "#3b82f6";
  const normalized = color.trim();
  return normalized.startsWith("#") || normalized.startsWith("rgb")
    ? normalized
    : "#3b82f6";
};

const toSoftAccent = (color) => {
  if (!color || typeof color !== "string") return "#94a3b8";

  const normalized = color.trim();
  const shortHex = normalized.match(/^#([0-9a-fA-F]{3})$/);
  const fullHex = normalized.match(/^#([0-9a-fA-F]{6})$/);

  const parseHex = (hex) => {
    const safeHex =
      hex.length === 3 ? hex.split("").map((char) => char + char).join("") : hex;
    const r = parseInt(safeHex.slice(0, 2), 16);
    const g = parseInt(safeHex.slice(2, 4), 16);
    const b = parseInt(safeHex.slice(4, 6), 16);
    return Number.isNaN(r) ? null : `rgba(${r},${g},${b},0.45)`;
  };

  if (shortHex) return parseHex(shortHex[1]) || "#94a3b8";
  if (fullHex) return parseHex(fullHex[1]) || "#94a3b8";
  if (normalized.startsWith("rgb")) {
    return normalized.replace(/\)\s*$/, ",0.45)").replace("rgb(", "rgba(");
  }

  return normalized;
};

const getConflictInfo = (dayEvents) => {
  if (!Array.isArray(dayEvents) || dayEvents.length < 2) {
    return { conflictIds: new Set(), conflictPairs: 0 };
  }

  const conflictIds = new Set();
  let conflictPairs = 0;

  for (let i = 0; i < dayEvents.length; i += 1) {
    const firstStart = toMinutes(
      dayEvents[i].startTime || dayEvents[i].inicioAgendamento,
    );
    const firstEnd = toMinutes(dayEvents[i].endTime || dayEvents[i].fimAgendamento);
    if (firstStart == null || firstEnd == null || firstEnd <= firstStart) continue;

    for (let j = i + 1; j < dayEvents.length; j += 1) {
      const secondStart = toMinutes(
        dayEvents[j].startTime || dayEvents[j].inicioAgendamento,
      );
      const secondEnd = toMinutes(
        dayEvents[j].endTime || dayEvents[j].fimAgendamento,
      );
      if (secondStart == null || secondEnd == null || secondEnd <= secondStart) {
        continue;
      }

      if (firstStart < secondEnd && secondStart < firstEnd) {
        conflictPairs += 1;
        conflictIds.add(dayEvents[i].id);
        conflictIds.add(dayEvents[j].id);
      }
    }
  }

  return { conflictIds, conflictPairs };
};

const getEventHeading = (evt) =>
  evt.fullTitle || evt.servico?.nome || evt.title || "Agendamento";

const getGroupKey = (evt) =>
  String(
    evt.servico?.id ??
      evt.servicoId ??
      evt.pedido?.id ??
      evt.pedidoId ??
      getEventHeading(evt) ??
      evt.id,
  );

const sortEventsByTime = (events) =>
  [...events].sort((a, b) =>
    String(a.startTime || a.inicioAgendamento || "").localeCompare(
      String(b.startTime || b.inicioAgendamento || ""),
    ),
  );

const groupEvents = (events) => {
  const groups = new Map();

  events.forEach((evt) => {
    const key = getGroupKey(evt);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        heading: getEventHeading(evt),
        events: [],
      });
    }
    groups.get(key).events.push(evt);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      events: sortEventsByTime(group.events),
    }))
    .sort((a, b) => {
      const firstA = a.events[0];
      const firstB = b.events[0];
      return String(
        firstA?.startTime || firstA?.inicioAgendamento || "",
      ).localeCompare(String(firstB?.startTime || firstB?.inicioAgendamento || ""));
    });
};

const EventCardCompact = ({
  evt,
  isConflict,
  isLowDensity,
  isTwoEvents,
  softAccent,
  onClick,
}) => {
  const time = evt.startTime || evt.inicioAgendamento || "--:--";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className={`flex justify-self-center cursor-pointer rounded-md border px-1.5 py-0.5 font-medium transition
        ${isLowDensity ? "h-[36px] w-[86%] max-w-[300px] flex-col items-center justify-center gap-0.5" : "h-[24px] w-[96%] items-center gap-1.5"}
        ${isConflict ? "border-red-200 bg-red-50/70 hover:bg-red-50" : "border-gray-200 bg-white/85 hover:bg-white"}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(evt);
      }}
      title={evt.fullTitle || evt.title}
    >
      {isLowDensity ? (
        <>
          <span
            className={`w-full truncate text-center text-[13px] font-bold ${isConflict ? "text-red-800" : "text-gray-700"}`}
          >
            {evt.title}
          </span>
          <div className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: softAccent }}
            />
            <span
              className={`shrink-0 text-[11px] font-semibold ${isConflict ? "text-red-700" : "text-gray-500"}`}
            >
              {time}
            </span>
          </div>
        </>
      ) : isTwoEvents ? (
        <>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: softAccent }}
          />
          <span
            className={`truncate text-[11px] font-semibold ${isConflict ? "text-red-800" : "text-gray-700"}`}
          >
            {evt.title}
          </span>
          <span
            className={`shrink-0 text-[10px] font-semibold ${isConflict ? "text-red-700" : "text-gray-500"}`}
          >
            {time}
          </span>
        </>
      ) : (
        <>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: softAccent }}
          />
          <span
            className={`shrink-0 text-[10px] font-semibold ${isConflict ? "text-red-700" : "text-gray-500"}`}
          >
            {time}
          </span>
          <span
            className={`truncate text-[11px] font-semibold ${isConflict ? "text-red-800" : "text-gray-700"}`}
          >
            {evt.title}
          </span>
        </>
      )}
    </motion.div>
  );
};

const EventCardExpanded = ({ evt, isConflict, accentColor, onClick }) => {
  const time = evt.startTime || evt.inicioAgendamento || "--:--";
  const end = evt.endTime || evt.fimAgendamento;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className={`flex w-full cursor-pointer overflow-hidden rounded-lg border transition hover:brightness-95
        ${isConflict ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(evt);
      }}
    >
      <div
        className="w-1 shrink-0 rounded-l-lg"
        style={{ backgroundColor: isConflict ? "#ef4444" : accentColor }}
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <span
          className={`truncate text-sm font-bold leading-tight ${isConflict ? "text-red-800" : "text-gray-800"}`}
        >
          {evt.title}
        </span>
        <span
          className={`text-xs font-semibold ${isConflict ? "text-red-600" : "text-[#134074ff]"}`}
        >
          {time}
          {end ? ` - ${end}` : ""}
        </span>
      </div>
      {isConflict && (
        <div className="flex shrink-0 items-center pr-1.5">
          <span className="rounded bg-red-100 px-1 text-[9px] font-bold text-red-700">
            !
          </span>
        </div>
      )}
    </motion.div>
  );
};

const ExpandedDayPanel = ({
  dayLabel,
  events,
  conflictIds,
  onEventClick,
  onClose,
}) => {
  const grouped = useMemo(() => groupEvents(events), [events]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const panelContent = (
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center bg-slate-900/20 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(78vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white opacity-100 shadow-2xl"
        style={{ backgroundColor: "#ffffff", opacity: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-gray-900 sm:text-xl">
                Agendamentos de {dayLabel}
              </p>
              <span className="inline-flex rounded-full bg-[#134074ff]/10 px-4 py-1.5 text-sm font-semibold text-[#134074ff]">
                {events.length} agendamento{events.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            aria-label="Fechar lista de agendamentos"
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1 overflow-y-auto bg-white p-3"
          style={{ backgroundColor: "#ffffff", opacity: 1 }}
        >
          <div
            className="flex flex-col gap-4 bg-white pr-0.5"
            style={{ backgroundColor: "#ffffff", opacity: 1 }}
          >
            {grouped.map((group) => (
              <section
                key={group.key}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                style={{ backgroundColor: "#ffffff", opacity: 1 }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-gray-900">
                      {group.heading}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {group.events.length} atividade
                      {group.events.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div
                  className="grid gap-2 bg-white p-3 md:grid-cols-2"
                  style={{ backgroundColor: "#ffffff", opacity: 1 }}
                >
                  {group.events.map((evt) => {
                    const isConflict = conflictIds.has(evt.id);
                    const accent = toAccentColor(
                      evt.backgroundColor || evt.color || "#3b82f6",
                    );

                    return (
                      <EventCardExpanded
                        key={evt.id}
                        evt={evt}
                        isConflict={isConflict}
                        accentColor={accent}
                        onClick={onEventClick}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
};

const MonthView = ({
  currentMonth,
  events,
  onDateClick,
  onEventClick,
  isFullscreen = false,
}) => {
  const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
  const end = startOfWeek(addDays(endOfMonth(currentMonth), 6), {
    weekStartsOn: 0,
  });
  const days = eachDayOfInterval({ start, end });
  const weeksCount = Math.ceil(days.length / 7);
  const { eventsByDate } = useEventsByDate(events);
  const [expandedDay, setExpandedDay] = useState(null);

  const weekDaysNames = isFullscreen
    ? ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div
      className={`flex h-full flex-1 flex-col ${isFullscreen ? "overflow-visible" : "overflow-hidden"}`}
    >
      <div className="grid shrink-0 grid-cols-7 border-b border-gray-200 bg-white">
        {weekDaysNames.map((weekDay) => (
          <div
            key={weekDay}
            className={`text-center font-bold tracking-widest text-gray-400 uppercase ${isFullscreen ? "py-3 text-sm" : "py-2 text-xs"}`}
          >
            {weekDay}
          </div>
        ))}
      </div>

      <div
        className={`grid flex-1 grid-cols-7 gap-px bg-gray-200 ${isFullscreen ? "overflow-visible" : "overflow-hidden"}`}
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
          const isLowDensity = dayEvents.length <= 1;
          const isTwoEvents = dayEvents.length === 2;
          const isExpandedDay = isFullscreen && expandedDay === dateKey;
          const dayLabel = format(day, "d 'de' MMMM", { locale: ptBR });
          const visibleEvents = isFullscreen
            ? dayEvents.slice(0, MAX_VISIBLE_FULLSCREEN)
            : dayEvents;
          const hiddenCount = isFullscreen
            ? Math.max(0, dayEvents.length - MAX_VISIBLE_FULLSCREEN)
            : 0;

          return (
            <div
              key={dateKey}
              className={`group relative flex min-h-0 flex-col border-gray-200 transition-colors
                ${isFullscreen ? "p-2" : "p-1.5"}
                ${isFullscreen ? "cursor-default" : isPast ? "cursor-not-allowed" : "cursor-pointer"}
                ${isExpandedDay ? "z-20 overflow-hidden bg-white shadow-inner ring-2 ring-[#134074ff]/20" : "overflow-hidden"}
                ${isPast
                  ? "bg-gray-100/50 opacity-90"
                  : isCurrent
                    ? isFullscreen ? "bg-white" : "bg-white hover:bg-blue-50/30"
                    : "bg-gray-100/80 opacity-50"}`}
              onClick={() => {
                if (!isFullscreen && !isPast) onDateClick?.(day);
              }}
            >
              {!isPast && !isFullscreen && (
                <button
                  className="absolute top-1.5 right-1.5 rounded-full p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDateClick?.(day);
                  }}
                  title="Adicionar evento"
                >
                  <Plus size={14} />
                </button>
              )}

              <div
                className={`flex shrink-0 items-start justify-between ${isFullscreen ? "mb-2 pr-1" : "mb-1 pr-6"}`}
              >
                <div className="relative">
                  <span
                    className={`flex items-center justify-center rounded-lg font-bold
                      ${isFullscreen ? "h-9 w-9 text-base" : "h-6 w-6 text-xs"}
                      ${isCurrentToday ? "bg-[#134074ff] text-white shadow-md" : "text-gray-700"}`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && !isCurrentToday && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-500" />
                  )}
                </div>

                {hasEvents && (
                  <div className="flex items-center gap-1">
                    {conflictPairs > 0 && (
                      <span
                        className={`rounded-md bg-red-100 font-semibold text-red-700 ${isFullscreen ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"}`}
                        title={`Conflitos: ${conflictPairs}`}
                      >
                        ! {conflictPairs}
                      </span>
                    )}
                    <span
                      className={`rounded-md bg-gray-100 font-semibold text-gray-600 ${isFullscreen ? "px-2 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"}`}
                    >
                      {dayEvents.length}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`flex-1 overflow-hidden
                  ${isFullscreen
                    ? hiddenCount > 0
                      ? "grid auto-rows-min grid-cols-2 gap-1"
                      : "flex flex-col gap-1.5"
                    : "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent grid grid-cols-1 auto-rows-min gap-1 overflow-y-auto pr-0.5"}`}
              >
                {visibleEvents.map((evt) => {
                  const isConflict = conflictIds.has(evt.id);
                  const accent = toAccentColor(
                    evt.backgroundColor || evt.color || "#3b82f6",
                  );
                  const soft = toSoftAccent(
                    evt.backgroundColor || evt.color || "#3b82f6",
                  );

                  return isFullscreen ? (
                    <EventCardExpanded
                      key={evt.id}
                      evt={evt}
                      isConflict={isConflict}
                      accentColor={accent}
                      onClick={onEventClick}
                    />
                  ) : (
                    <EventCardCompact
                      key={evt.id}
                      evt={evt}
                      isConflict={isConflict}
                      isLowDensity={isLowDensity}
                      isTwoEvents={isTwoEvents}
                      softAccent={soft}
                      onClick={onEventClick}
                    />
                  );
                })}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-lg bg-[#002A4B]/8 py-1.5 text-center text-xs font-semibold text-[#002A4B] transition hover:bg-[#002A4B]/15"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedDay((current) =>
                        current === dateKey ? null : dateKey,
                      );
                    }}
                  >
                    +{hiddenCount} mais
                  </button>
                )}
              </div>

              {isExpandedDay && (
                <ExpandedDayPanel
                  dayLabel={dayLabel}
                  events={dayEvents}
                  conflictIds={conflictIds}
                  onEventClick={onEventClick}
                  onClose={() => setExpandedDay(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
