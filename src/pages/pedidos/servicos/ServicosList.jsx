import { useMemo, useState, useEffect } from "react"; // Removido o React default
import PropTypes from "prop-types"; // Importação para validação de props
import { useModal } from "../../../hooks/useModal";
import { usePagination } from "../../../hooks/usePagination";
import { useNavigate } from "react-router-dom";
import { Wrench, Trash2, AlertTriangle, FileText, Pencil } from "lucide-react";
import SkeletonLoader from "../../../components/feedback/Skeleton/SkeletonLoader";
import NovoPedidoServicoModal from "../components/NovoPedidoServicoModal";
import EditarServicoModal from "../components/EditarServicoModal";
import PedidosService from "../../../api/services/pedidosService";
import { formatDate } from "../../../utils/formatters";
import Button from "../../../components/ui/Button/Button.component";

function StatusPill({ status }) {
  const styles = {
    Ativo:
      "inline-flex items-center px-2.5 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-wide bg-[#bfdbfe] text-[#1e3a8a]",
    Finalizado:
      "inline-flex items-center px-2.5 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-wide bg-[#d1fae5] text-[#065f46]",
    "Em Andamento":
      "inline-flex items-center px-2.5 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-wide bg-[#fef3c7] text-[#92400e]",
    Cancelado:
      "inline-flex items-center px-2.5 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-wide bg-[#fecaca] text-[#991b1b]",
    Aguardando:
      "inline-flex items-center px-2.5 py-1 rounded-2xl text-[11px] font-medium uppercase tracking-wide bg-[#fef3c7] text-[#92400e]",
  };
  return <span className={styles[status] || styles.Ativo}>{status}</span>;
}

StatusPill.propTypes = {
  status: PropTypes.string,
};

function Progress({ value = 0, total = 6, dark = false }) {
  const pct = Math.min(100, Math.round((Number(value) / Number(total)) * 100));
  return (
    <div className="flex items-center gap-2 w-full mt-1">
      <div className="h-2 w-full max-w-[120px] rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: dark ? "#475569" : "#007EA7",
          }}
        />
      </div>
      <span className="text-xs text-slate-500 font-medium">
        {value}/{total}
      </span>
    </div>
  );
}

Progress.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  total: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  dark: PropTypes.bool,
};

const formatServicoId = (id) => {
  if (!id) return "";
  const idString = String(id);
  if (/^\d+$/.test(idString)) {
    return idString.padStart(3, "0");
  }
  return idString;
};

const ITEMS_PER_PAGE = 5;

// Removida a constante NOVO_FORM que não estava sendo usada

export default function ServicosList({
  busca = "",
  triggerNovoRegistro,
  onNovoRegistroHandled,
  statusFilter,
  etapaFilter,
  clienteInicial,
}) {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState([]);
  // Removido clientes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {
    modal,
    open: openModal,
    closeAll,
  } = useModal(["confirm", "view", "form", "novo", "editar"]);
  // Removido mode, form, errors
  const [current, setCurrent] = useState(null);
  const [targetId, setTargetId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultPedidos = await PedidosService.buscarPedidosDeServico();

      const servicosMapeados = resultPedidos.success
        ? resultPedidos.data.map((s) => PedidosService.mapearParaFrontend(s))
        : [];

      const servicosSimples = [];

      const idsDePedidos = new Set(servicosMapeados.map((s) => String(s.id)));
      const servicosSemDuplicata = servicosSimples.filter(
        (s) => !idsDePedidos.has(String(s.id)),
      );

      const todos = [...servicosMapeados, ...servicosSemDuplicata];

      if (todos.length === 0 && !resultPedidos.success && !resultServicos.success) {
        setError(resultPedidos.error || resultServicos.error);
        setServicos([]);
      } else {
        const servicosOrdenados = todos.sort((a, b) => {
          const idAisNum = /^\d+$/.test(a.id);
          const idBisNum = /^\d+$/.test(b.id);
          if (idAisNum && idBisNum)
            return parseInt(b.id, 10) - parseInt(a.id, 10);
          if (a.id < b.id) return 1;
          if (a.id > b.id) return -1;
          return 0;
        });

        setServicos(servicosOrdenados);

        if (current) {
          const updatedCurrent = servicosOrdenados.find(
            (s) => s.id === current.id,
          );
          if (updatedCurrent) {
            setCurrent(updatedCurrent);
          }
        }
      }
    } catch (error) {
      console.error("Erro inesperado ao buscar serviços:", error);
      setError("Erro inesperado ao carregar serviços");
      setServicos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (triggerNovoRegistro) {
      openModal("novo");
      onNovoRegistroHandled();
    }
  }, [triggerNovoRegistro, onNovoRegistroHandled]);

  const listaFiltrada = useMemo(() => {
    return PedidosService.filtrarServicos(servicos, {
      busca,
      status: statusFilter,
      etapa: etapaFilter,
    });
  }, [busca, servicos, statusFilter, etapaFilter]);

  const {
    page,
    setPage,
    paginated: pagina,
    totalPages,
    startIndex,
    endIndex,
    total,
    next,
    prev,
  } = usePagination(listaFiltrada, ITEMS_PER_PAGE);

  const fecharTodos = () => {
    closeAll();
    setCurrent(null);
  };

  const abrirEditar = (item) => {
    navigate(`/Servicos/${item.id}`);
  };

  const abrirConfirmarExclusao = (id) => {
    setTargetId(id);
    openModal("confirm");
  };

  const confirmarExclusao = async () => {
    if (!targetId) return;

    try {
      const result = await PedidosService.deletarServico(targetId);

      if (result.success) {
        setServicos(servicos.filter((s) => s.id !== targetId));
        fecharTodos();
      } else {
        console.error("Erro ao excluir serviço:", result.error);
        alert(`Erro ao excluir serviço: ${result.error}`);
      }
    } catch (error) {
      console.error("Erro inesperado ao excluir serviço:", error);
      alert("Erro inesperado ao excluir serviço. Tente novamente.");
    }
  };

  // Removido o parâmetro novoServico que não era usado
  const handleNovoServicoSuccess = async () => {
    await fetchData();
    setPage(1);
  };

  const handleEditarServicoSuccess = async (servicoAtualizado) => {
    setCurrent(servicoAtualizado);
    await fetchData();
  };

  return (
    <>
      <div className="flex flex-col gap-4 w-full py-4">
        {loading && <SkeletonLoader count={ITEMS_PER_PAGE} />}

        {!loading && error && (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg border border-red-200">
            <p className="font-medium">Erro ao carregar serviços</p>
            <p className="text-sm mt-1">{error}</p>
            <Button variant="danger" size="sm" onClick={fetchData}>
              Tentar Novamente
            </Button>
          </div>
        )}

        {!loading && !error && pagina.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            {listaFiltrada.length === 0 && servicos.length === 0
              ? "Nenhum serviço cadastrado ainda."
              : "Nenhum serviço encontrado com os filtros atuais."}
          </div>
        )}

        {!loading &&
          !error &&
          pagina.map((item) => {
            const isCompleted = item.etapa === "Concluído" || item.status === "Cancelado";
            const hasActiveAgendamento = (item.servico?.agendamentos || []).some(
              (ag) => ag.statusAgendamento?.nome &&
                ag.statusAgendamento.nome !== "CANCELADO" &&
                ag.statusAgendamento.nome !== "INATIVO",
            );
            const isInactive =
              item.ativo === false ||
              item.servico?.ativo === false ||
              String(item.status || "").toLowerCase() === "inativo";
            const isGrayCard = (isInactive && !hasActiveAgendamento) || isCompleted;
            return (
            <article
              key={item.id}
              className={`flex flex-col gap-3 rounded-lg border p-5 w-full shadow-[0_10px_24px_-8px_rgba(15,23,42,0.24),-10px_0_20px_-16px_rgba(15,23,42,0.18),10px_0_20px_-16px_rgba(15,23,42,0.18)] transition-all hover:shadow-[0_16px_36px_-10px_rgba(15,23,42,0.28),-12px_0_24px_-18px_rgba(15,23,42,0.2),12px_0_24px_-18px_rgba(15,23,42,0.2)] ${isGrayCard ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-slate-200"}`}
            >
              {/* HEADER DO CARD */}
              <header className="flex flex-col gap-2 pb-3 border-b border-slate-100 md:flex-row md:items-center md:justify-between">
                {/* Título + status */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-md ${isGrayCard ? "text-gray-400 bg-gray-200" : "text-slate-400 bg-slate-100"}`}
                    >
                      <Wrench size={16} />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-sm md:text-base ${isGrayCard ? "text-gray-600" : "text-slate-800"}`}
                      >
                        Serviço #{formatServicoId(item.id)}
                      </h3>
                      <span
                        className={`text-xs block md:hidden ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                      >
                        {formatDate(item.data)}
                      </span>
                    </div>
                  </div>
                  <StatusPill status={item.status} />
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1">
                  <div className="hidden md:block h-4 w-px bg-slate-200 mx-1"></div>
                  <button
                    type="button"
                    className="p-2 rounded-md text-slate-500 cursor-pointer hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title="Editar"
                    onClick={() => abrirEditar(item)}
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-md text-slate-500 cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title="Ver Orçamentos"
                    onClick={() => navigate(`/Servicos/${item.id}/orcamentos`)}
                  >
                    <FileText size={20} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-md text-slate-500 cursor-pointer hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Excluir"
                    onClick={() => abrirConfirmarExclusao(item.id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Preço
                  </span>
                  <span
                    className={`text-md font-medium ${isGrayCard ? "text-gray-500" : "text-slate-700"}`}
                  >
                    {item.valorTotal > 0
                      ? `R$ ${item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : item.servico?.precoBase > 0
                        ? `R$ ${item.servico.precoBase.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "A negociar"}
                  </span>
                </div>

                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Serviço
                  </span>
                  <p
                    className={`text-md font-medium line-clamp-2 leading-snug w-full text-left ${isGrayCard ? "text-gray-500" : "text-slate-700"}`}
                    title={item.servicoNome || item.produtosDesc}
                  >
                    {item.servicoNome ||
                      item.produtosDesc ||
                      "Serviço não especificado"}
                  </p>
                </div>

                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Descrição
                  </span>
                  <p
                    className={`text-sm line-clamp-2 leading-snug w-full text-left ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                    title={item.descricao}
                  >
                    {item.descricao || "Sem descrição"}
                  </p>
                </div>

                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Cliente
                  </span>
                  <span
                    className={`text-md font-medium truncate w-full text-left ${isGrayCard ? "text-gray-500" : "text-slate-700"}`}
                    title={item.clienteNome}
                  >
                    {item.clienteNome || `ID: ${item.clienteId}`}
                  </span>
                </div>

                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Etapa
                  </span>
                  <span
                    className={`text-md font-medium truncate w-full text-left ${isGrayCard ? "text-gray-500" : "text-slate-700"}`}
                    title={item.etapa}
                  >
                    {item.etapa}
                  </span>
                  <Progress
                    value={item.progresso?.[0]}
                    total={item.progresso?.[1]}
                    dark={isGrayCard}
                  />
                </div>

                <div className="md:col-span-2 flex flex-col items-start justify-start gap-2">
                  <span
                    className={`text-md font-bold mb-1 ${isGrayCard ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Data
                  </span>
                  <span
                    className={`text-md font-medium ${isGrayCard ? "text-gray-500" : "text-slate-700"}`}
                  >
                    {formatDate(item.data)}
                  </span>
                </div>
              </div>
            </article>
          );
          })}
      </div>

      {/* Rodapé de paginação */}
      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <div className="text-sm text-slate-500">
            Mostrando{" "}
            <span className="font-medium text-slate-800">{startIndex + 1}</span>{" "}
            a{" "}
            <span className="font-medium text-slate-800">{endIndex}</span>{" "}
            de {total} resultado{total !== 1 ? "s" : ""}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={next}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO */}
      {modal.confirm && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) fecharTodos();
          }}
        >
          <div className="flex flex-col gap-4 w-full max-w-md bg-white rounded-xl shadow-2xl p-6 animate-scaleIn">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 text-xl">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                Excluir Serviço?
              </h2>
              <p className="text-slate-600">
                Você está prestes a excluir o serviço{" "}
                <span className="font-bold">#{formatServicoId(targetId)}</span>.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="ghost" onClick={fecharTodos} fullWidth>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarExclusao} fullWidth>
                Sim, Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      <NovoPedidoServicoModal
        isOpen={modal.novo}
        onClose={fecharTodos}
        onSuccess={handleNovoServicoSuccess}
        tipoInicial="servico"
        clienteInicial={clienteInicial}
      />

      <EditarServicoModal
        key={
          current?.id
            ? `servico-${current.id}-${current.etapa}-${current.servico?.agendamentos?.length || 0}`
            : "servico-modal"
        }
        isOpen={modal.editar}
        onClose={fecharTodos}
        servico={current}
        onSuccess={handleEditarServicoSuccess}
      />
    </>
  );
}

ServicosList.propTypes = {
  busca: PropTypes.string,
  triggerNovoRegistro: PropTypes.bool,
  onNovoRegistroHandled: PropTypes.func,
  statusFilter: PropTypes.string,
  etapaFilter: PropTypes.string,
};
