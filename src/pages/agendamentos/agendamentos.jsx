/* eslint-disable no-unused-vars */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import { useLocation } from "react-router-dom";
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
import AgendamentoDetailModal from "./components/AgendamentoDetailModal";
import Kpis from "../../components/kpis/Kpis";

import CalendarView from "./components/CalendarView";
import MiniCalendar from "./components/MiniCalendar";
import UpcomingEvents from "./components/UpcomingEvents";
import EditarAgendamentoSimples from "../pedidos/components/EditarAgendamentoSimples";
import {
  getAgendamentoDisplayName,
  isCancelledStatus,
  isConcludedStatus,
  isFinalizedStatus,
  isVisibleInDailyAgenda,
} from "./utils/eventHelpers";

import { cn } from "../../utils/cn";
import { useAgendamentos } from "../../hooks/queries/useAgendamentos";
import agendamentosService from "../../api/services/agendamentosService";
import PedidosService from "../../api/services/pedidosService";

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

function ActionsDropdown({
  agendamento,
  onStatusChange,
  onDelete,
  onEdit,
  onView,
  onLocation,
}) {
  const [open, setOpen] = useState(false);

  const statusNome = agendamento?.statusAgendamento?.nome || "";
  const statusNorm = normalizeStatus(statusNome);
  const isFinalizado = isFinalizedStatus(statusNome);

  const hasEndereco = (() => {
    if (!agendamento?.endereco) return false;
    const e = agendamento.endereco;
    return [e.rua, e.bairro, e.cidade].some(Boolean);
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
            {!isFinalizado && (
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
            )}
            {statusNorm !== "CONFIRMADO" && !isFinalizado && (
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
            )}
            {!isConcludedStatus(statusNome) && !isFinalizado && (
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
            )}
            {!isFinalizado && <div className="my-1 border-t border-gray-100" />}
            {!isConcludedStatus(statusNome) && !isFinalizado && (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, isDeleting }) {
  useEffect(() => {
    if (!isOpen) return undefined;

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
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
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
              <div className="bg-gray-100 p-2 rounded">
                <AlertTriangle className="h-6 w-6 text-gray-700" />
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
  const headerRef = useRef(null);
  const location = useLocation();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (!headerRef.current) return;
      const headerElement =
        headerRef.current.querySelector?.("header") || headerRef.current;
      const height = headerElement?.offsetHeight ?? 0;
      setHeaderHeight(height);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarViewType, setCalendarViewType] = useState("month");
  const [calendarSelectedEvent, setCalendarSelectedEvent] = useState(null);
  const [isUpcomingEventsCollapsed, setIsUpcomingEventsCollapsed] =
    useState(false);
  const shouldShowMiniCalendar = ["week", "day", "list"].includes(
    calendarViewType,
  );

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const [showReagendarModal, setShowReagendarModal] = useState(false);
  const [agendamentoToReagendar, setAgendamentoToReagendar] = useState(null);
  const [tasks, setTasks] = useState([]);
  const autoOpenFromServiceRef = useRef(false);

  const { data: agendamentos = [], isLoading, refetch } = useAgendamentos();

  const handleEventDeleted = () => refetch();

  const [activeKpiFilter, setActiveKpiFilter] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;

      if (deleteTarget) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setDeleteTarget(null);
        return;
      }

      if (detailTarget) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setDetailTarget(null);
        return;
      }

      if (showReagendarModal) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setShowReagendarModal(false);
        setAgendamentoToReagendar(null);
        return;
      }

      if (showTaskModal) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setShowTaskModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, detailTarget, showReagendarModal, showTaskModal]);

  const filteredTasks = useMemo(() => {
    if (!activeKpiFilter) return tasks;
    if (activeKpiFilter === 'today') {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      return tasks.filter((t) => isVisibleInDailyAgenda(t, todayStr));
    }
    if (activeKpiFilter === 'confirmed') {
      return tasks.filter(t => t.statusAgendamento?.nome === "CONFIRMADO");
    }
    if (activeKpiFilter === 'pending') {
      return tasks.filter(t => t.statusAgendamento?.nome === "PENDENTE");
    }
    return tasks;
  }, [tasks, activeKpiFilter]);

  const calendarActiveTasks = useMemo(() => filteredTasks, [filteredTasks]);

  const handleKpiClick = useCallback((filterType) => {
    if (activeKpiFilter === filterType) {
      setActiveKpiFilter(null);
    } else {
      setActiveKpiFilter(filterType);
      setCalendarViewType("list");
    }
  }, [activeKpiFilter]);

  useEffect(() => {
    if (!agendamentos) return;
    const transformedTasks = agendamentos.map((agendamento) => {
      const dataFormatada = agendamento.dataAgendamento;
      const startTime =
        agendamento.inicioAgendamento?.substring(0, 5) || "00:00";
      const endTime = agendamento.fimAgendamento?.substring(0, 5) || "00:00";
      const { shortTitle, fullTitle } = getAgendamentoDisplayName(agendamento);

      const SERVICE_COLORS = [
        "#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444",
        "#06B6D4","#EC4899","#6366F1","#84CC16","#F97316",
      ];
      const servicoId = agendamento.servico?.id ?? agendamento.servicoId ?? null;
      let backgroundColor;
      if (servicoId != null) {
        backgroundColor = SERVICE_COLORS[servicoId % SERVICE_COLORS.length];
      } else {
        backgroundColor = agendamento.tipoAgendamento === "ORCAMENTO" ? "#FBBF24" : "#3B82F6";
      }

      return {
        id: agendamento.id,
        title: shortTitle,
        fullTitle,
        date: dataFormatada,
        startTime: startTime,
        endTime: endTime,
        backgroundColor: backgroundColor,
        ...agendamento,
      };
    });
    setTasks(transformedTasks);
  }, [agendamentos]);

  const stats = useMemo(() => {
    const todayKey = format(new Date(), "yyyy-MM-dd");
    return {
      today: agendamentos.filter((a) => isVisibleInDailyAgenda(a, todayKey)).length,
      confirmed: agendamentos.filter(
        (a) =>
          a.statusAgendamento?.nome === "CONFIRMADO" &&
          a.dataAgendamento >= todayKey,
      ).length,
      pending: agendamentos.filter(
        (a) =>
          a.statusAgendamento?.nome === "PENDENTE" &&
          a.dataAgendamento >= todayKey,
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

  const handleNewAgendamento = useCallback(
    (overrides = {}) => {
      setModalInitialData({
        eventDate: overrides.eventDate || format(selectedDate, "yyyy-MM-dd"),
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

  useEffect(() => {
    const routeState = location.state;
    const tipoRota = String(routeState?.tipo || "").toLowerCase();

    if (
      autoOpenFromServiceRef.current ||
      !routeState ||
      !["servico", "orcamento"].includes(tipoRota) ||
      !routeState.servicoId
    ) {
      return;
    }

    let cancelled = false;

    const openServiceAgendamento = async () => {
      try {
        const result = await PedidosService.buscarPorId(routeState.servicoId);
        if (!result.success || cancelled) {
          return;
        }

        const pedidoCompleto = result.data;
        const pedidoLabel =
          pedidoCompleto?.servico?.nome ||
          routeState.servicoNome ||
          `Pedido #${routeState.servicoId}`;
        const isOrcamento = tipoRota === "orcamento";

        setModalInitialData({
          tipoAgendamento: {
            value: isOrcamento ? "ORCAMENTO" : "SERVICO",
            label: isOrcamento ? "Orçamento" : "Prestação de serviço",
          },
          pedido: {
            value: pedidoCompleto?.id || routeState.servicoId,
            label: pedidoLabel,
            originalData: pedidoCompleto,
          },
          eventDate: format(new Date(), "yyyy-MM-dd"),
          startTime: "",
          endTime: "",
        });
        setShowTaskModal(true);
        autoOpenFromServiceRef.current = true;
      } catch (error) {
        console.error("❌ Erro ao preparar agendamento:", error);
      }
    };

    openServiceAgendamento();

    return () => {
      cancelled = true;
    };
  }, [location.state]);

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

  const handleReagendarSuccess = () => {
    setShowReagendarModal(false);
    setAgendamentoToReagendar(null);
    refetch();
  };



  const getServicoNome = (apt) => {
    if (apt.servico?.nome) return apt.servico.nome;
    if (apt.servico?.codigo) return apt.servico.codigo;
    return apt.tipoAgendamento === "ORCAMENTO" ? "Orçamento" : "Serviço";
  };

  const getEnderecoResumo = (apt) => {
    if (!apt.endereco) return null;
    const e = apt.endereco;
    const parts = [e.rua, e.bairro, e.cidade].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const getFuncionarioNomes = (apt) => {
    if (!apt.funcionarios?.length) return "Sem funcionário";
    return apt.funcionarios.map((f) => f.nome).join(", ");
  };

  const getStatusNome = (apt) => apt.statusAgendamento?.nome || "PENDENTE";

  if (isLoading) {
    return (
      <div className="app-page flex min-h-screen bg-gray-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="app-content flex min-h-screen flex-1 flex-col">
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
    <div
      className="app-page flex min-h-screen font-[Inter]"
      style={{ backgroundColor: "#f7f9fa" }}
    >
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col" >
        <Header
          ref={headerRef}
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />

        <main
          className="relative flex flex-1 flex-col items-center justify-start gap-10 px-4 transition-all duration-300 sm:px-6 md:px-8"
          style={{ paddingTop: `${headerHeight + 40}px` }}
        >
          <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-4 px-4 pt-14 pb-4 md:px-6">
            {/* ====== Header ====== */}
            <div className="text-center w-full mx-auto mb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 gap-2">
                Agendamentos
              </h1>
            </div>

            {/* ====== Stats ====== */}
            <div className="w-full shrink-0">
              <div className="flex flex-col sm:flex-row w-full rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">
                {[
                  {
                    label: "Agendamentos de Hoje",
                    value: stats.today,
                    dotColor: "bg-blue-500",
                    badgeColor: "bg-gray-100 text-gray-700",
                    filter: "today",
                  },
                  {
                    label: "Agendamentos Confirmados",
                    value: stats.confirmed,
                    dotColor: "bg-emerald-500",
                    badgeColor: "bg-emerald-100 text-emerald-700",
                    filter: "confirmed",
                  },
                  {
                    label: "Agendamentos Pendentes",
                    value: stats.pending,
                    dotColor: "bg-amber-400",
                    badgeColor: "bg-amber-100 text-amber-700",
                    filter: "pending",
                  },
                ].map((item, idx, arr) => (
                  <button
                    key={item.filter}
                    onClick={() => handleKpiClick(item.filter)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2.5 px-4 py-3 transition-colors duration-150 cursor-pointer",
                      "hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400",
                      activeKpiFilter === item.filter ? "bg-gray-50" : "bg-white",
                      idx < arr.length - 1
                        ? "border-b sm:border-b-0 sm:border-r border-gray-400"
                        : "",
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.dotColor)} />
                    <span className="text-sm font-medium text-gray-700 text-left leading-tight">
                      {item.label}
                    </span>
                    <span className={cn("ml-1 shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold", item.badgeColor)}>
                      {item.value}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ====== Filter Indicator ====== */}
            {activeKpiFilter && (
              <div className="w-full flex shrink-0 flex-col gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 px-6 shadow-sm md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Filtro ativo: <strong>{activeKpiFilter === 'today' ? 'Agendamentos de Hoje' : activeKpiFilter === 'confirmed' ? 'Agendamentos Confirmados' : 'Agendamentos Pendentes'}</strong>
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveKpiFilter(null)} className="text-blue-700 bg-white border border-blue-200 hover:bg-blue-100 h-9 font-bold px-4">
                  Limpar Filtro
                </Button>
              </div>
            )}

            {/* ====== Area Principal do Calendário ====== */}
            <div className="relative flex min-h-[600px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
              {/* Right Panel */}
              <div
                className={cn(
                  "order-2 hidden w-full shrink-0 flex-col bg-gray-50/50 transition-all duration-300 lg:order-none lg:flex",
                  shouldShowMiniCalendar
                    ? "border-t border-gray-200 lg:w-[300px] lg:border-l lg:border-t-0 xl:w-[340px]"
                    : isUpcomingEventsCollapsed
                      ? "lg:w-0 lg:border-l-0"
                      : "border-t border-gray-200 lg:w-[300px] lg:border-l lg:border-t-0 xl:w-[340px]",
                )}
              >
                {(!isUpcomingEventsCollapsed || shouldShowMiniCalendar) && (
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-text-primary">
                        Próximos eventos
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    "scrollbar-thin scrollbar-thumb-gray-200 flex flex-1 flex-col gap-3 overflow-y-auto",
                    !isUpcomingEventsCollapsed || shouldShowMiniCalendar
                      ? "p-4"
                      : "overflow-hidden p-0",
                  )}
                >
                  {shouldShowMiniCalendar && (
                    <MiniCalendar
                      selectedDate={selectedDate}
                      onDateSelect={(date) => {
                        setSelectedDate(date);
                        setCalendarViewType("day");
                      }}
                    />
                  )}
                  {!isUpcomingEventsCollapsed && shouldShowMiniCalendar && (
                    <div className="my-1 border-t border-gray-200" />
                  )}
                  {!isUpcomingEventsCollapsed && (
                    <UpcomingEvents
                      events={calendarActiveTasks}
                      onViewEvent={setCalendarSelectedEvent}
                      onEditEvent={handleEdit}
                      onViewCalendar={() => setCalendarViewType("list")}
                    />
                  )}
                </div>
              </div>
              {/* Main Calendar View */}
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white min-h-[500px]">
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  viewType={calendarViewType}
                  onViewChange={setCalendarViewType}
                  selectedEvent={calendarSelectedEvent}
                  onEventSelect={setCalendarSelectedEvent}
                  onEventCreate={handleNewAgendamento}
                  events={calendarActiveTasks}
                  onEventDeleted={handleEventDeleted}
                  isUpcomingEventsCollapsed={isUpcomingEventsCollapsed}
                  onToggleUpcomingEvents={() =>
                    setIsUpcomingEventsCollapsed((current) => !current)
                  }
                />
              </div>
            </div>
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

      <EditarAgendamentoSimples
        isOpen={showReagendarModal}
        onClose={() => {
          setShowReagendarModal(false);
          setAgendamentoToReagendar(null);
        }}
        agendamento={agendamentoToReagendar}
        onSuccess={handleReagendarSuccess}
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
    </div>
  );
}
