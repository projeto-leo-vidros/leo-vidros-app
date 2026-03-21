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
import AgendamentoNotification from "../../components/ui/misc/AgendamentoNotification";
import AgendamentoDetailModal from "./components/AgendamentoDetailModal";
import Kpis from "../../components/kpis/Kpis";

import CalendarView from "./components/CalendarView";
import MiniCalendar from "./components/MiniCalendar";
import UpcomingEvents from "./components/UpcomingEvents";
import EditarAgendamentoSimples from "../pedidos/components/EditarAgendamentoSimples";

import { cn } from "../../utils/cn";
import { useAgendamentos } from "../../hooks/queries/useAgendamentos";
import { useAgendamentoNotifications } from "./hooks/useAgendamentoNotifications";
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
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showReagendarModal, setShowReagendarModal] = useState(false);
  const [agendamentoToReagendar, setAgendamentoToReagendar] = useState(null);
  const [tasks, setTasks] = useState([]);

  const { data: agendamentos = [], isLoading, refetch } = useAgendamentos();

  const handleEventDeleted = () => refetch();

  useEffect(() => {
    if (!agendamentos) return;
    const transformedTasks = agendamentos.map((agendamento) => {
      const dataFormatada = agendamento.dataAgendamento;
      const startTime = agendamento.inicioAgendamento?.substring(0, 5) || "00:00";
      const endTime = agendamento.fimAgendamento?.substring(0, 5) || "00:00";

      let fullTitle = "Agendamento";
      let calendarTitle = `#${String(agendamento.id).padStart(3, "0")}`;

      if (agendamento.servico) {
        const codigo = agendamento.servico.codigo || "";
        const nome = agendamento.servico.nome || "";
        fullTitle = `${codigo} ${nome}`.trim() || agendamento.tipoAgendamento || "Agendamento";
        if (codigo) calendarTitle = codigo;
      } else {
        fullTitle = agendamento.tipoAgendamento || "Agendamento";
      }

      let backgroundColor = "#3B82F6";
      if (agendamento.tipoAgendamento === "SERVICO") backgroundColor = "#3B82F6";
      else if (agendamento.tipoAgendamento === "ORCAMENTO") backgroundColor = "#FBBF24";

      return {
        id: agendamento.id,
        title: calendarTitle,
        fullTitle: fullTitle,
        date: dataFormatada,
        startTime: startTime,
        endTime: endTime,
        backgroundColor: backgroundColor,
        ...agendamento,
      };
    });
    setTasks(transformedTasks);
  }, [agendamentos]);

  const { currentNotification, dismissNotification } =
    useAgendamentoNotifications(tasks);


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

  const handleReagendarFromNotification = async (agendamento) => {
    dismissNotification();
    setAgendamentoToReagendar(agendamento);
    setShowReagendarModal(true);
  };

  const handleReagendarSuccess = () => {
    setShowReagendarModal(false);
    setAgendamentoToReagendar(null);
    refetch();
  };

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
    <div
          className="flex min-h-screen font-[Inter]"
          style={{ backgroundColor: "#f7f9fa" }}
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    
          <div className="flex-1 flex flex-col">
            <Header
              ref={headerRef}
              toggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
            />

        <main className="flex-1 flex flex-col items-center relative justify-start px-6 sm:px-8 md:px-10  gap-10 transition-all duration-300"
        style={{ paddingTop: `${headerHeight + 40}px` }}
        >
          <div className="flex flex-col h-full w-full max-w-[1920px] mx-auto px-4 pt-10 pb-4 md:px-6 gap-4">
            {/* ====== Header ====== */}
            <div className="flex items-center justify-center shrink-0">
              <h1 className="text-2xl font-bold text-gray-800">
                Agendamentos
              </h1>
            </div>

            {/* ====== Stats ====== */}
            <div className="shrink-0 w-full [&>div]:!grid-cols-1 sm:[&>div]:!grid-cols-3 [&>div]:!gap-12">
              <Kpis
                stats={[
                  {
                    title: "Agendamentos de Hoje",
                    value: stats.today,
                    icon: CalendarIcon,
                  },
                  {
                    title: "Agendamentos Confirmados",
                    value: stats.confirmed,
                    icon: Check,
                  },
                  {
                    title: "Agendamentos Pendentes",
                    value: stats.pending,
                    icon: Clock,
                  },
                ]}
              />
            </div>

            {/* ====== Area Principal do Calendário ====== */}
            <div className="flex-1 min-h-0 flex rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Main Calendar View */}
              <div className="flex-1 min-w-0 flex flex-col bg-white overflow-hidden">
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onEventCreate={handleNewAgendamento}
                  events={tasks}
                  onEventDeleted={handleEventDeleted}
                />
              </div>

              {/* Right Panel */}
              <div
                className={`${
                  rightPanelCollapsed ? "w-16" : "w-[340px]"
                } shrink-0 transition-all duration-300 border-l border-gray-200 bg-gray-50/50 flex flex-col`}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                      className="cursor-pointer text-gray-500"
                    >
                      {rightPanelCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </Button>
                    {!rightPanelCollapsed && (
                      <h2 className="font-semibold text-gray-800">Calendário</h2>
                    )}
                  </div>
                </div>

                {!rightPanelCollapsed && (
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                    {/* <MiniCalendar
                      selectedDate={selectedDate}
                      onDateSelect={(date) => setSelectedDate(date)}
                    /> */}
                    <div className="border-t border-gray-100 my-4" />
                    <UpcomingEvents events={tasks} />
                  </div>
                )}
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
      {currentNotification && (
        <AgendamentoNotification
          agendamento={currentNotification}
          onReagendar={handleReagendarFromNotification}
          onCancelar={handleNotificationCancelar}
          onIniciar={handleNotificationIniciar}
          onClose={dismissNotification}
        />
      )}
    </div>
  );
}
