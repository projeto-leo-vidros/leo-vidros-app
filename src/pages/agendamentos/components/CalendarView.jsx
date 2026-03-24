import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays, startOfWeek, addMonths, parseISO } from "date-fns";
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
  List,
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

import MonthView from "./views/MonthView";
import WeekView from "./views/WeekView";
import DayView from "./views/DayView";
import ListView from "./views/ListView";

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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-center gap-4">
                <div className="shrink-0 rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  Cancelar Agendamento?
                </h3>
              </div>
              <p className="textleading-relaxed p-6 text-sm font-bold text-gray-900">
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
                      <Loader2 className="h-4 w-4 animate-spin" />
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
            <div className="flex min-h-screen items-center justify-center px-4 pb-10">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <EventHeader
                  title={details.title}
                  badges={badges}
                  onClose={onClose}
                />

                <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 overflow-y-auto">
                  <div className="space-y-6 p-3">
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

const CalendarView = ({
  selectedDate,
  onDateSelect,
  viewType: externalViewType,
  onViewChange,
  onEventCreate,
  events = [],
  onEventDeleted,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [internalViewType, setInternalViewType] = useState("month");
  const viewType = externalViewType || internalViewType;
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [selectedDate]);

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

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect?.(today);
  };
  const handleViewChange = (type) => {
    if (onViewChange) onViewChange(type);
    else setInternalViewType(type);
  };

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
      className="relative flex h-full flex-col overflow-hidden border border-gray-200 bg-white"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-1">
            <button
              onClick={handlePrev}
              className="cursor-pointer rounded-md p-1.5 text-gray-600 transition hover:bg-white hover:shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="cursor-pointer rounded-md p-1.5 text-gray-600 transition hover:bg-white hover:shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 capitalize">
              {renderHeaderTitle()}
            </h2>
            <button
              onClick={handleTodayClick}
              className="cursor-pointer rounded-full border border-blue-100 bg-[#134074ff] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-100"
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
          <div className="mx-2 h-6 w-px bg-gray-300 sm:mx-4"></div>

          <div className="flex items-center gap-0 rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
            {["list", "day", "week", "month"].map((type) => (
              <button
                key={type}
                onClick={() => handleViewChange(type)}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-all ${
                  viewType === type
                    ? "bg-[#134074ff] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {type === "list" ? <List size={18} /> : <CalendarIcon size={18} />}
                {{ list: "Todos", day: "Dia", week: "Semana", month: "Mês" }[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-gray-50/50">
        <AnimatePresence mode="wait">
          {viewType === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col"
            >
              <ListView
                events={events}
                onEventClick={handleEventClick}
              />
            </motion.div>
          )}
          {viewType === "day" && (
            <motion.div
              key="day"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col"
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
              className="absolute inset-0 flex flex-col"
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
              className="absolute inset-0 flex flex-col"
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
        onCancel={() => {
          setShowEditModal(false);
          setSelectedEvent(editingEvent); // Restaura o modal anterior
          setEditingEvent(null);
        }}
        agendamento={editingEvent}
        onSuccess={handleEditSuccess}
      />
    </motion.div>
  );
};

export default CalendarView;
