import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  User,
  Check,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Trash2,
  Edit3,
  AlertTriangle,
  Eye,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import TaskCreateModal from "../../components/ui/misc/TaskCreateModal";
import Button from "../../components/ui/Button/Button.component";
import WeeklyCalendar from "./components/WeeklyCalendar";
import MiniCalendarAgendamentos from "./components/MiniCalendarAgendamentos";
import AgendamentoNotification from "../../components/ui/misc/AgendamentoNotification";
import AgendamentoDetailModal from "./components/AgendamentoDetailModal";

import { cn } from "../../utils/cn";
import { useAgendamentos } from "../../hooks/queries/useAgendamentos";
import { useAgendamentoNotifications } from "../calendar-dashboard/hooks/useAgendamentoNotifications";
import agendamentosService from "../../api/services/agendamentosService";

import {
  normalizeStatus,
  statusConfig,
  getStatusConfig,
  tipoConfig,
} from "../../utils/agendamentoStatus";

function StatusBadge({ status }) {
  const config = getStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.color,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

function TipoBadge({ tipo }) {
  const config = tipoConfig[tipo] || tipoConfig.SERVICO;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.color,
      )}
    >
      {config.label}
    </span>
  );
}

function StatCard({ icon: IconComp, iconColor, value, label }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm transition-shadow hover:shadow-md">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          iconColor,
        )}
      >
        <IconComp className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ActionsDropdown({
  agendamento,
  onStatusChange,
  onDelete,
  onEdit,
  onView,
  onLocation,
}) {
  const [open, setOpen] = useState(false);

  const hasEndereco = (() => {
    if (!agendamento?.endereco) return false;
    const e = agendamento.endereco;
    return [e.rua, e.numero, e.bairro, e.cidade].some(Boolean);
  })();

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-gray-100"
      >
        <MoreHorizontal className="h-4 w-4 text-gray-500" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-in fade-in slide-in-from-top-2 absolute top-8 right-0 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl">
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(agendamento);
                setOpen(false);
              }}
            >
              <Eye className="h-4 w-4 text-gray-400" /> Ver informações
            </button>
            {hasEndereco && (
              <button
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onLocation?.(agendamento);
                  setOpen(false);
                }}
              >
                <MapPin className="h-4 w-4 text-gray-400" /> Ver localização
              </button>
            )}
            <div className="my-1 border-t border-gray-100" />
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(agendamento);
                setOpen(false);
              }}
            >
              <Edit3 className="h-4 w-4 text-gray-400" /> Editar
            </button>
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-green-600 transition-colors hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(agendamento, "CONFIRMADO");
                setOpen(false);
              }}
            >
              <Check className="h-4 w-4" /> Confirmar
            </button>
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-blue-600 transition-colors hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(agendamento, "CONCLUIDO");
                setOpen(false);
              }}
            >
              <Check className="h-4 w-4" /> Concluir
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(agendamento);
                setOpen(false);
              }}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Excluir Agendamento?
              </h3>
            </div>
            <p className="mb-6 text-gray-600">
              Esta ação é irreversível e removerá o agendamento permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
                  </>
                ) : (
                  "Sim, excluir"
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Agendamentos() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const { data: agendamentos = [], isLoading, refetch } = useAgendamentos();

  const transformedForNotifications = useMemo(
    () =>
      agendamentos.map((a) => ({
        ...a,
        date: a.dataAgendamento,
        startTime: a.inicioAgendamento?.substring(0, 5),
        endTime: a.fimAgendamento?.substring(0, 5),
      })),
    [agendamentos],
  );
  const { currentNotification, dismissNotification } =
    useAgendamentoNotifications(transformedForNotifications);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const agendamentosByDate = useMemo(() => {
    const map = new Map();
    agendamentos.forEach((apt) => {
      const key = apt.dataAgendamento;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(apt);
    });
    return map;
  }, [agendamentos]);

  const selectedDayAgendamentos = useMemo(() => {
    const key = format(selectedDate, "yyyy-MM-dd");
    return (agendamentosByDate.get(key) || []).sort((a, b) =>
      (a.inicioAgendamento || "").localeCompare(b.inicioAgendamento || ""),
    );
  }, [selectedDate, agendamentosByDate]);

  const agendamentoDates = useMemo(
    () => [...new Set(agendamentos.map((a) => a.dataAgendamento))],
    [agendamentos],
  );

  const stats = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    return {
      today: agendamentos.filter((a) => a.dataAgendamento === todayKey).length,
      confirmed: agendamentos.filter(
        (a) => a.statusAgendamento?.nome === "CONFIRMADO",
      ).length,
      pending: agendamentos.filter(
        (a) => a.statusAgendamento?.nome === "PENDENTE",
      ).length,
    };
  }, [agendamentos]);

  const navigate = useNavigate();

  const handleLocation = useCallback(
    (apt) => {
      if (!apt?.endereco) return;
      const e = apt.endereco;
      const address = [
        e.rua,
        e.numero,
        e.bairro,
        e.cidade,
        e.uf || e.estado,
        e.cep,
      ]
        .filter(Boolean)
        .join(", ");
      navigate("/geo-localizacao", { state: { address } });
    },
    [navigate],
  );

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeek(new Date());
    setSelectedDate(new Date());
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    if (!isSameMonth(day, currentMonth)) {
      setCurrentMonth(day);
    }
  };

  const handleNewAgendamento = useCallback(
    (overrides = {}) => {
      setModalInitialData({
        eventDate: overrides.date || format(selectedDate, "yyyy-MM-dd"),
        startTime: overrides.startTime || "",
        endTime: overrides.endTime || "",
        tipoAgendamento: "",
        pedido: null,
        funcionarios: [],
      });
      setShowTaskModal(true);
    },
    [selectedDate],
  );

  const handleTaskSave = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleStatusChange = useCallback(
    async (apt, newStatusNome) => {
      try {
        const result = await agendamentosService.update(apt.id, {
          tipoAgendamento: apt.tipoAgendamento,
          dataAgendamento: apt.dataAgendamento,
          inicioAgendamento: apt.inicioAgendamento,
          fimAgendamento: apt.fimAgendamento,
          statusAgendamento: { tipo: "AGENDAMENTO", nome: newStatusNome },
          observacao: apt.observacao || null,
        });
        if (result.success) {
          refetch();
        } else {
          console.error(
            "Erro ao atualizar status:",
            result.error,
            result.status,
          );
          Swal.fire({
            icon: "error",
            title: "Erro ao atualizar status",
            text:
              result.error ||
              "Não foi possível alterar o status do agendamento.",
            timer: 4000,
            showConfirmButton: true,
          });
        }
      } catch (err) {
        console.error("Erro ao atualizar status:", err);
      }
    },
    [refetch],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await agendamentosService.delete(deleteTarget.id);
      if (result.success) {
        refetch();
        setDeleteTarget(null);
      } else {
        console.error("Erro ao excluir:", result.error);
        Swal.fire({
          icon: "error",
          title: "Erro ao excluir",
          text: result.error || "Não foi possível excluir o agendamento.",
          timer: 4000,
          showConfirmButton: true,
        });
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refetch]);

  const handleEdit = useCallback((apt) => {
    setModalInitialData({
      eventDate: apt.dataAgendamento,
      startTime: apt.inicioAgendamento?.substring(0, 5) || "",
      endTime: apt.fimAgendamento?.substring(0, 5) || "",
      tipoAgendamento: apt.tipoAgendamento || "",
      pedido: null,
      funcionarios: apt.funcionarios?.map((f) => f.id) || [],
      agendamentoId: apt.id,
    });
    setShowTaskModal(true);
  }, []);

  const handleNotificationCancelar = useCallback(
    async (agendamento) => {
      if (
        window.confirm(
          `Cancelar agendamento #${String(agendamento.id).padStart(3, "0")}?`,
        )
      ) {
        try {
          await agendamentosService.delete(agendamento.id);
          dismissNotification();
          refetch();
        } catch (err) {
          console.error("Erro ao cancelar:", err);
        }
      }
    },
    [dismissNotification, refetch],
  );

  const handleNotificationIniciar = useCallback(
    async (agendamento) => {
      try {
        await agendamentosService.update(agendamento.id, {
          tipoAgendamento: agendamento.tipoAgendamento,
          dataAgendamento: agendamento.dataAgendamento,
          inicioAgendamento: agendamento.inicioAgendamento,
          fimAgendamento: agendamento.fimAgendamento,
          statusAgendamento: { tipo: "AGENDAMENTO", nome: "EM ANDAMENTO" },
          observacao: agendamento.observacao || "",
        });
        dismissNotification();
        refetch();
      } catch (err) {
        console.error("Erro ao iniciar:", err);
      }
    },
    [dismissNotification, refetch],
  );

  const getServicoNome = (apt) => {
    if (apt.servico?.nome) return apt.servico.nome;
    if (apt.servico?.codigo) return apt.servico.codigo;
    return apt.tipoAgendamento === "ORCAMENTO" ? "Orçamento" : "Serviço";
  };

  const getEnderecoResumo = (apt) => {
    if (!apt.endereco) return null;
    const e = apt.endereco;
    const parts = [e.rua, e.numero, e.bairro, e.cidade].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const getFuncionarioNomes = (apt) => {
    if (!apt.funcionarios?.length) return "Sem funcionário";
    return apt.funcionarios.map((f) => f.nome).join(", ");
  };

  const getStatusNome = (apt) => apt.statusAgendamento?.nome || "PENDENTE";

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
          <div className="h-[80px]" />
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#007EA7]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="h-[80px]" />

        <main className="flex flex-1 flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8">
          <div className="w-full max-w-[1680px] space-y-6">
            {/* ====== Header ====== */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="hidden flex-1 sm:block" />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">
                  Agendamentos
                </h1>
                <p className="mt-1 text-gray-500">
                  Gerencie os agendamentos da Leo Vidros
                </p>
              </div>
              <div className="flex flex-1 sm:justify-end">
                <Button
                  onClick={() => handleNewAgendamento()}
                  variant="primary"
                  size="sm"
                  startIcon={<Plus className="h-5 w-5" />}
                >
                  Novo Agendamento
                </Button>
              </div>
            </div>

            {/* ====== Stats ====== */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={CalendarIcon}
                iconColor="bg-[#007EA7]/10 text-[#007EA7]"
                value={stats.today}
                label="Hoje"
              />
              <StatCard
                icon={Check}
                iconColor="bg-green-500/10 text-green-600"
                value={stats.confirmed}
                label="Confirmados"
              />
              <StatCard
                icon={Clock}
                iconColor="bg-yellow-500/10 text-yellow-600"
                value={stats.pending}
                label="Pendentes"
              />
            </div>

            {/* ====== Abas de Visualização ====== */}
            <div
              className="flex w-fit items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1.5 shadow-sm"
              style={{ marginTop: "15px" }}
            >
              {[
                { key: "calendar", label: "Mensal", icon: CalendarIcon },
                { key: "week", label: "Semanal", icon: LayoutGrid },
                { key: "list", label: "Lista", icon: List },
              ].map(({ key, label, icon: TabIcon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                    viewMode === key
                      ? "bg-[#134074ff] text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                >
                  <TabIcon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {/* ====== Visualização Mensal ====== */}
            {viewMode === "calendar" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Calendário mensal */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-md lg:col-span-2">
                  {/* Nav do mês */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800 capitalize">
                      {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToday}
                        className="cursor-pointer rounded-lg border border-[#007EA7]/30 px-3 py-1.5 text-sm font-medium text-[#007EA7] transition-colors hover:bg-[#007EA7]/5"
                      >
                        Hoje
                      </button>
                      <button
                        onClick={handlePrevMonth}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Dias da semana */}
                  <div className="grid grid-cols-7 border-b border-gray-100">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (day) => (
                        <div
                          key={day}
                          className="py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Grid de dias */}
                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const dayAgendamentos =
                        agendamentosByDate.get(dayKey) || [];
                      const isSelected = isSameDay(day, selectedDate);
                      const isToday = isSameDay(day, new Date());
                      const isCurrentMonth = isSameMonth(day, currentMonth);

                      return (
                        <button
                          key={i}
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            "relative min-h-[90px] cursor-pointer border-r border-b border-gray-100 p-2 text-left transition-all",
                            isSelected
                              ? "bg-[#007EA7]/5 ring-2 ring-[#007EA7]/30 ring-inset"
                              : "hover:bg-gray-50",
                            !isCurrentMonth && "opacity-40",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex items-center justify-center text-sm font-semibold",
                              isToday &&
                                "h-7 w-7 rounded-full bg-[#007EA7] text-white",
                              !isToday && isSelected && "text-[#007EA7]",
                              !isToday && !isSelected && "text-gray-700",
                            )}
                          >
                            {format(day, "d")}
                          </span>

                          {dayAgendamentos.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {dayAgendamentos.slice(0, 2).map((apt) => {
                                const tipoCfg =
                                  tipoConfig[apt.tipoAgendamento] ||
                                  tipoConfig.SERVICO;
                                return (
                                  <div
                                    key={apt.id}
                                    className={cn(
                                      "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                                      tipoCfg.color,
                                    )}
                                  >
                                    {apt.inicioAgendamento?.substring(0, 5)}{" "}
                                    {getServicoNome(apt)?.split(" ")[0]}
                                  </div>
                                );
                              })}
                              {dayAgendamentos.length > 2 && (
                                <div className="pl-1 text-[10px] font-medium text-gray-400">
                                  +{dayAgendamentos.length - 2} mais
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Painel lateral - Detalhe do dia */}
                <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-md">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-800 capitalize">
                      {format(selectedDate, "EEEE", { locale: ptBR })}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {selectedDayAgendamentos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarIcon className="mx-auto mb-3 h-14 w-14 text-gray-200" />
                        <p className="font-medium text-gray-400">
                          Nenhum agendamento
                        </p>
                        <p className="mt-1 pb-2 text-xs text-gray-300">
                          Clique abaixo para agendar
                        </p>
                        <Button
                          onClick={() =>
                            handleNewAgendamento({
                              date: format(selectedDate, "yyyy-MM-dd"),
                            })
                          }
                          variant="primary"
                          size="sm"
                          startIcon={<Plus className="h-4 w-4" />}
                        >
                          Agendar
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDayAgendamentos.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => setDetailTarget(apt)}
                            className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#007EA7]/10">
                                  <User className="h-5 w-5 text-[#007EA7]" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {getServicoNome(apt)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {getFuncionarioNomes(apt)}
                                  </p>
                                </div>
                              </div>
                              <ActionsDropdown
                                agendamento={apt}
                                onStatusChange={handleStatusChange}
                                onDelete={(a) => setDeleteTarget(a)}
                                onEdit={handleEdit}
                                onView={(a) => setDetailTarget(a)}
                                onLocation={handleLocation}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {apt.inicioAgendamento?.substring(0, 5)} -{" "}
                                {apt.fimAgendamento?.substring(0, 5)}
                              </span>
                              {getEnderecoResumo(apt) && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="max-w-[120px] truncate">
                                    {getEnderecoResumo(apt)}
                                  </span>
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <StatusBadge status={getStatusNome(apt)} />
                              <TipoBadge tipo={apt.tipoAgendamento} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ====== Visualização Semanal ====== */}
            {viewMode === "week" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Mini Calendar + Resumo */}
                <div className="space-y-4 lg:col-span-1">
                  <MiniCalendarAgendamentos
                    currentDate={currentWeek}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setCurrentWeek(date);
                      setSelectedDate(date);
                    }}
                    agendamentoDates={agendamentoDates}
                  />

                  {/* Resumo do dia */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      {selectedDayAgendamentos.length}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">agendamentos</p>
                  </div>

                  {/* Legenda */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                    <p className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      Legenda
                    </p>
                    <div className="space-y-2">
                      {Object.entries(tipoConfig).map(([key, cfg]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: cfg.dotColor }}
                          />
                          <span className="text-xs text-gray-600">
                            {cfg.label}
                          </span>
                        </div>
                      ))}
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <div
                            key={key}
                            className="mt-1.5 flex items-center gap-2"
                          >
                            <span
                              className={cn("h-3 w-3 rounded-full", cfg.dot)}
                            />
                            <span className="text-xs text-gray-600">
                              {cfg.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendário Semanal */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-md lg:col-span-3">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-gray-800">
                      Semana de{" "}
                      {format(
                        startOfWeek(currentWeek, { weekStartsOn: 0 }),
                        "dd/MM",
                      )}{" "}
                      a{" "}
                      {format(
                        endOfWeek(currentWeek, { weekStartsOn: 0 }),
                        "dd/MM/yyyy",
                      )}
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToday}
                        className="cursor-pointer rounded-lg border border-[#007EA7]/30 px-3 py-1.5 text-sm font-medium text-[#007EA7] transition-colors hover:bg-[#007EA7]/5"
                      >
                        Hoje
                      </button>
                      <button
                        onClick={handlePrevWeek}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={handleNextWeek}
                        className="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="h-[600px]">
                    <WeeklyCalendar
                      agendamentos={agendamentos}
                      currentDate={currentWeek}
                      onAgendamentoClick={(apt) => {
                        setSelectedDate(parseISO(apt.dataAgendamento));
                        setDetailTarget(apt);
                      }}
                      onSlotClick={(date, time) => {
                        handleNewAgendamento({
                          date: format(date, "yyyy-MM-dd"),
                          startTime: time,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ====== Visualização em Lista ====== */}
            {viewMode === "list" && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-md">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    Todos os Agendamentos
                  </h2>
                  <p className="text-sm text-gray-500">
                    {agendamentos.length} registros
                  </p>
                </div>

                <div className="divide-y divide-gray-100">
                  {agendamentos.length === 0 ? (
                    <div className="xt-center flex flex-col items-center py-16 text-gray-400">
                      <CalendarIcon className="mx-auto mb-3 h-16 w-16 text-gray-200" />
                      <p className="text-lg font-medium">
                        Nenhum agendamento encontrado
                      </p>
                      <p className="mt-1 text-sm">
                        Crie o primeiro agendamento clicando no botão acima
                      </p>
                    </div>
                  ) : (
                    [...agendamentos]
                      .sort((a, b) =>
                        `${a.dataAgendamento}${a.inicioAgendamento}`.localeCompare(
                          `${b.dataAgendamento}${b.inicioAgendamento}`,
                        ),
                      )
                      .map((apt) => (
                        <div
                          key={apt.id}
                          onClick={() => setDetailTarget(apt)}
                          className="flex cursor-pointer flex-col justify-between gap-3 px-6 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center"
                        >
                          {/* Info principal */}
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                              style={{
                                backgroundColor:
                                  tipoConfig[apt.tipoAgendamento]?.dotColor ||
                                  "#007EA7",
                              }}
                            >
                              {apt.tipoAgendamento === "ORCAMENTO"
                                ? "OR"
                                : "SV"}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {getServicoNome(apt)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {getFuncionarioNomes(apt)}
                              </p>
                            </div>
                          </div>

                          {/* Data/hora */}
                          <div className="text-sm sm:text-right">
                            <p className="font-semibold text-gray-700">
                              {apt.dataAgendamento
                                ? format(
                                    parseISO(apt.dataAgendamento),
                                    "dd/MM/yyyy",
                                  )
                                : "—"}
                            </p>
                            <p className="text-gray-500">
                              {apt.inicioAgendamento?.substring(0, 5)} -{" "}
                              {apt.fimAgendamento?.substring(0, 5)}
                            </p>
                          </div>

                          {/* Endereço */}
                          <div className="hidden max-w-[200px] truncate text-sm text-gray-500 md:block">
                            {getEnderecoResumo(apt) ? (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                {getEnderecoResumo(apt)}
                              </span>
                            ) : (
                              <span className="text-gray-300">
                                Sem endereço
                              </span>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            <StatusBadge status={getStatusNome(apt)} />
                            <TipoBadge tipo={apt.tipoAgendamento} />
                          </div>

                          {/* Ações */}
                          <ActionsDropdown
                            agendamento={apt}
                            onStatusChange={handleStatusChange}
                            onDelete={(a) => setDeleteTarget(a)}
                            onEdit={handleEdit}
                            onView={(a) => setDetailTarget(a)}
                            onLocation={handleLocation}
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ====== Modais ====== */}
      <TaskCreateModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          refetch();
        }}
        onSave={handleTaskSave}
        initialData={modalInitialData}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <AgendamentoDetailModal
        agendamento={detailTarget}
        isOpen={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={handleEdit}
        onLocation={handleLocation}
      />

      {/* Notificação de agendamento próximo */}
      {currentNotification && (
        <AgendamentoNotification
          agendamento={currentNotification}
          onReagendar={() => dismissNotification()}
          onCancelar={handleNotificationCancelar}
          onIniciar={handleNotificationIniciar}
          onClose={dismissNotification}
        />
      )}
    </div>
  );
}
