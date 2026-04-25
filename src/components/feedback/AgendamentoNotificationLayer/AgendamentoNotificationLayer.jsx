import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { X, Plus } from "lucide-react";
import { queryKeys } from "../../../api/queryKeys";
import agendamentosService from "../../../api/services/agendamentosService";
import { useAgendamentos } from "../../../hooks/queries/useAgendamentos";
import AgendamentoNotification from "../../ui/misc/AgendamentoNotification";
import { useAgendamentoNotifications } from "../../../pages/agendamentos/hooks/useAgendamentoNotifications";
import Api from "../../../api/client/Api";
import { useUser } from "../../../context/UserContext";

const buildPayload = (agendamento, nomeStatus) => ({
  servicoId: agendamento.servico?.id,
  tipoAgendamento: agendamento.tipoAgendamento,
  dataAgendamento: agendamento.dataAgendamento,
  inicioAgendamento: agendamento.inicioAgendamento,
  fimAgendamento: agendamento.fimAgendamento,
  statusAgendamento: { tipo: "AGENDAMENTO", nome: nomeStatus },
  observacao: agendamento.observacao || " ",
  endereco: agendamento.endereco
    ? {
        rua: agendamento.endereco.rua || "",
        numero: agendamento.endereco.numero || 0,
        bairro: agendamento.endereco.bairro || "",
        cidade: agendamento.endereco.cidade || "",
        uf: agendamento.endereco.uf || "",
        cep: agendamento.endereco.cep || "",
        pais: agendamento.endereco.pais || "Brasil",
        complemento: agendamento.endereco.complemento || "",
      }
    : { rua: "", numero: 0, bairro: "", cidade: "", uf: "", cep: "", pais: "Brasil", complemento: "" },
  funcionariosIds: (agendamento.funcionarios || []).map((f) => f.id),
  produtos: [],
});

export default function AgendamentoNotificationLayer() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { data: agendamentos = [] } = useAgendamentos({
    enabled: user.isAuthenticated,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!user.isAuthenticated) {
      queryClient.removeQueries({ queryKey: queryKeys.agendamentos.all() });
    }
  }, [user.isAuthenticated, queryClient]);

  const agendamentosParaNotificar = useMemo(
    () => (user.isAuthenticated ? agendamentos : []),
    [user.isAuthenticated, agendamentos]
  );

  const { notifications, dismissNotification } =
    useAgendamentoNotifications(agendamentosParaNotificar);
  const compactTimersRef = useRef(new Map());
  const compactKeysRef = useRef(new Set());
  const lockedOpenKeysRef = useRef(new Set());
  const [compactKeys, setCompactKeys] = useState(() => new Set());

  // Modal de finalização
  const [finalizarModal, setFinalizarModal] = useState(null);
  const [produtosUsados, setProdutosUsados] = useState({});
  const [produtosQuantidades, setProdutosQuantidades] = useState({});
  const [finalizarLoading, setFinalizarLoading] = useState(false);

  // Seletor manual de produtos (quando agendamentoProdutos está vazio)
  const [estoqueItems, setEstoqueItems] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]); // [{estoqueId, produtoId, nome, qtdReservada, qtdUsada}]
  const [buscaProduto, setBuscaProduto] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const updateCompactKeys = useCallback((updater) => {
    setCompactKeys((prev) => {
      const base = prev instanceof Set ? new Set(prev) : new Set();
      const next = typeof updater === "function" ? updater(base) : updater;
      const normalized = next instanceof Set ? next : new Set(next || []);
      compactKeysRef.current = normalized;
      return normalized;
    });
  }, []);

  useEffect(() => {
    const activeKeys = new Set(notifications.map((item) => item.key));

    updateCompactKeys((prev) => {
      const next = new Set();
      prev.forEach((key) => {
        if (activeKeys.has(key)) next.add(key);
      });
      return next;
    });

    for (const key of Array.from(lockedOpenKeysRef.current)) {
      if (!activeKeys.has(key)) lockedOpenKeysRef.current.delete(key);
    }

    for (const [key, timerId] of compactTimersRef.current.entries()) {
      if (!activeKeys.has(key)) {
        clearTimeout(timerId);
        compactTimersRef.current.delete(key);
      }
    }

    notifications.forEach((item) => {
      if (item.tipo !== "iniciar") return;
      if (compactKeysRef.current.has(item.key)) return;
      if (lockedOpenKeysRef.current.has(item.key)) return;
      if (compactTimersRef.current.has(item.key)) return;

      const timerId = setTimeout(() => {
        updateCompactKeys((prev) => {
          const next = new Set(prev);
          next.add(item.key);
          return next;
        });
        compactTimersRef.current.delete(item.key);
      }, 60000);

      compactTimersRef.current.set(item.key, timerId);
    });
  }, [notifications, updateCompactKeys]);

  const handleExpandNotification = useCallback((key) => {
    if (!key) return;
    lockedOpenKeysRef.current.add(key);
    const timerId = compactTimersRef.current.get(key);
    if (timerId) {
      clearTimeout(timerId);
      compactTimersRef.current.delete(key);
    }
    updateCompactKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [updateCompactKeys]);

  const handleAtualizarStatus = async (agendamento, nomeStatus) => {
    const result = await agendamentosService.update(
      agendamento.id,
      buildPayload(agendamento, nomeStatus),
    );
    if (!result.success) {
      throw new Error(result.error || "Não foi possível atualizar o agendamento.");
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
  };

  const handleIniciar = async (agendamento) => {
    try {
      await handleAtualizarStatus(agendamento, "EM ANDAMENTO");
      dismissNotification(`${agendamento.id}:iniciar`);
      Swal.fire({
        icon: "success",
        title: "Agendamento iniciado",
        text: "O agendamento foi marcado como em andamento.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro ao iniciar", text: err.message });
    }
  };

  const handleFinalizar = async (agendamento) => {
    const tipo = (agendamento.tipoAgendamento || "").toUpperCase();
    if (tipo !== "SERVICO") {
      try {
        await handleAtualizarStatus(agendamento, "CONCLUÍDO");
        dismissNotification(`${agendamento.id}:finalizar`);
        Swal.fire({
          icon: "success",
          title: "Agendamento finalizado",
          text: "O agendamento foi concluído.",
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({ icon: "error", title: "Erro ao finalizar", text: err.message });
      }
      return;
    }

    // Carregar estoque para o seletor manual
    Api.get("/estoques", { params: { size: 200 } })
      .then((res) => {
        const data = res.data;
        setEstoqueItems(data?.content ?? (Array.isArray(data) ? data : []));
      })
      .catch(() => {});

    let produtos = agendamento.agendamentoProdutos ?? agendamento.produtos ?? [];

    // Se não há produtos no agendamento, buscar do pedido vinculado ao serviço
    if (produtos.length === 0) {
      const pedidoId = agendamento.servico?.pedidoId;
      if (pedidoId) {
        try {
          const res = await Api.get(`/pedidos/${pedidoId}`);
          const itensPedido = res.data?.itensPedido ?? [];
          produtos = itensPedido
            .filter((item) => item.produtoId)
            .map((item) => ({
              produto: { id: item.produtoId, nome: item.nomeProduto },
              quantidadeReservada: item.quantidadeSolicitada,
              quantidadeUtilizada: null,
            }));
        } catch {
          // sem itens — vai para seletor manual
        }
      }
    }

    const iniciais = {};
    const qtds = {};
    produtos.forEach((ap, i) => {
      iniciais[i] = true;
      qtds[i] = ap.quantidadeReservada ?? ap.quantidade ?? 1;
    });
    setProdutosUsados(iniciais);
    setProdutosQuantidades(qtds);
    setProdutosSelecionados([]);
    setBuscaProduto("");
    setDropdownOpen(false);
    setFinalizarModal({ agendamento, produtos });
  };

  const adicionarProdutoManual = (item) => {
    const produtoId = item.produto?.id;
    const nome = item.produto?.nome || item.nome || `Produto #${item.id}`;
    if (produtosSelecionados.some((p) => p.estoqueId === item.id)) return;
    setProdutosSelecionados((prev) => [
      ...prev,
      { estoqueId: item.id, produtoId, nome, qtdReservada: 1, qtdUsada: 1 },
    ]);
    setBuscaProduto("");
    setDropdownOpen(false);
  };

  const removerProdutoManual = (idx) => {
    setProdutosSelecionados((prev) => prev.filter((_, i) => i !== idx));
  };

  const atualizarQtdManual = (idx, field, value) => {
    setProdutosSelecionados((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: parseFloat(value) || 0 } : p)),
    );
  };

  const handleConfirmarFinalizar = async () => {
    if (!finalizarModal) return;
    const { agendamento, produtos } = finalizarModal;
    setFinalizarLoading(true);
    try {
      let produtosPayload = [];

      if (produtos.length > 0) {
        produtosPayload = produtos
          .map((ap, i) => {
            const usado = produtosUsados[i] !== false;
            const qtdUsada = usado
              ? parseFloat(produtosQuantidades[i] ?? ap.quantidadeReservada) || 0
              : 0;
            return {
              produtoId: ap.produto?.id,
              quantidadeUtilizada: qtdUsada,
              quantidadeReservada: ap.quantidadeReservada ?? 0,
            };
          })
          .filter((p) => p.produtoId);
      } else if (produtosSelecionados.length > 0) {
        produtosPayload = produtosSelecionados
          .map((p) => ({
            produtoId: p.produtoId,
            quantidadeUtilizada: p.qtdUsada,
            quantidadeReservada: p.qtdReservada,
          }))
          .filter((p) => p.produtoId);
      }

      if (produtosPayload.length > 0) {
        await Api.put(`/agendamentos/${agendamento.id}`, {
          ...buildPayload(agendamento, "CONCLUÍDO"),
          produtos: produtosPayload,
        });
      } else {
        await handleAtualizarStatus(agendamento, "CONCLUÍDO");
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      dismissNotification(`${agendamento.id}:finalizar`);
      setFinalizarModal(null);
      Swal.fire({
        icon: "success",
        title: "Serviço finalizado",
        text: "O agendamento foi concluído.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro ao finalizar", text: err.message });
    } finally {
      setFinalizarLoading(false);
    }
  };

  const handleReagendar = async (currentAgendamento) => {
    Swal.fire({
      icon: "info",
      title: "Reagendamento",
      text: `Abra a agenda para reagendar o agendamento #${String(currentAgendamento.id).padStart(3, "0")}.`,
    });
  };

  const handleCancelar = async (agendamento) => {
    try {
      const result = await agendamentosService.delete(agendamento.id);
      if (!result.success) {
        throw new Error(result.error || "Não foi possível cancelar o agendamento.");
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.agendamentos.all() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
      dismissNotification(
        `${agendamento.id}:${agendamento.tipoAgendamento === "ORCAMENTO" ? "finalizar" : "iniciar"}`,
      );
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erro ao cancelar", text: err.message });
    }
  };

  const produtosFiltrados = estoqueItems.filter((item) => {
    const nome = item.produto?.nome || item.nome || "";
    return nome.toLowerCase().includes(buscaProduto.toLowerCase());
  });

  return (
    <>
      <div className="fixed right-6 bottom-6 z-[9999] flex max-h-[calc(100vh-3rem)] w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 overflow-y-auto">
        {notifications.map((item) => (
          <AgendamentoNotification
            key={item.key}
            agendamento={item.agendamento}
            tipo={item.tipo}
            presentation={compactKeys.has(item.key) ? "compact" : "floating"}
            onReagendar={handleReagendar}
            onCancelar={handleCancelar}
            onIniciar={handleIniciar}
            onFinalizar={handleFinalizar}
            onClose={() => dismissNotification(item.key)}
            onExpand={() => handleExpandNotification(item.key)}
          />
        ))}
      </div>

      {finalizarModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-[#002A4B] px-6 py-5">
              <h3 className="text-base font-bold text-white">Finalizar Serviço — Produtos Utilizados</h3>
              <p className="text-xs text-white/70 mt-1.5">
                Informe quais produtos foram utilizados e as quantidades reais. O excedente será devolvido ao estoque.
              </p>
            </div>

            <div className="p-6 flex flex-col gap-4 max-h-[460px] overflow-y-auto">
              {finalizarModal.produtos.length > 0 ? (
                /* Produtos vinculados ao agendamento */
                finalizarModal.produtos.map((ap, i) => {
                  const usado = produtosUsados[i] !== false;
                  const nome = ap.produto?.nome || `Produto #${i + 1}`;
                  const reservado = parseFloat(ap.quantidadeReservada ?? ap.quantidade ?? 0);
                  const utilizado = parseFloat(produtosQuantidades[i] ?? reservado) || 0;
                  const devolve = reservado - utilizado;
                  return (
                    <div
                      key={i}
                      className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${usado ? "border-[#b9deeb] bg-[#eef8fc]" : "border-gray-200 bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={usado}
                          onChange={(e) => setProdutosUsados((prev) => ({ ...prev, [i]: e.target.checked }))}
                          className="w-4 h-4 accent-[#007EA7] cursor-pointer shrink-0"
                        />
                        <span className="text-sm font-semibold text-gray-800 flex-1">
                          {nome}
                          <span className="text-gray-400 font-normal ml-2 text-xs">(reservado: {reservado} un)</span>
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${usado ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                          {usado ? "Utilizado" : "Não utilizado"}
                        </span>
                      </div>
                      {usado && (
                        <div className="flex items-center gap-3 pl-7">
                          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Qtd. utilizada:</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={produtosQuantidades[i] ?? reservado}
                            onChange={(e) => setProdutosQuantidades((prev) => ({ ...prev, [i]: parseFloat(e.target.value) || 0 }))}
                            className="w-24 px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none"
                          />
                          {devolve > 0 && (
                            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                              devolve {devolve.toFixed(2)} ao estoque
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Seletor manual de produtos */
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-gray-500">
                    Selecione os produtos utilizados neste serviço. O que não for totalmente consumido voltará ao estoque.
                  </p>

                  {/* Campo de busca */}
                  <div className="relative">
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white focus-within:ring-2 focus-within:ring-[#007EA7] focus-within:border-[#007EA7]">
                      <Plus className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={buscaProduto}
                        onChange={(e) => { setBuscaProduto(e.target.value); setDropdownOpen(true); }}
                        onFocus={() => setDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                        placeholder="Buscar e adicionar produto..."
                        className="flex-1 text-sm outline-none bg-transparent"
                      />
                    </div>
                    {dropdownOpen && produtosFiltrados.length > 0 && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-44 overflow-y-auto">
                        {produtosFiltrados.slice(0, 30).map((item) => {
                          const nome = item.produto?.nome || item.nome || `Produto #${item.id}`;
                          const jaSelecionado = produtosSelecionados.some((p) => p.estoqueId === item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseDown={() => adicionarProdutoManual(item)}
                              disabled={jaSelecionado}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${jaSelecionado ? "text-gray-300 cursor-default" : "hover:bg-[#eef8fc] hover:text-[#007EA7] cursor-pointer"}`}
                            >
                              {nome}
                              {jaSelecionado && <span className="ml-2 text-xs text-gray-400">já adicionado</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Lista de produtos selecionados */}
                  {produtosSelecionados.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {produtosSelecionados.map((p, i) => {
                        const devolve = p.qtdReservada - p.qtdUsada;
                        return (
                          <div key={i} className="flex flex-col gap-3 p-4 rounded-lg border border-[#b9deeb] bg-[#eef8fc]">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 flex-1">{p.nome}</span>
                              <button
                                type="button"
                                onClick={() => removerProdutoManual(i)}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Qtd. total informada</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={p.qtdReservada}
                                  onChange={(e) => atualizarQtdManual(i, "qtdReservada", e.target.value)}
                                  className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500">Qtd. utilizada</label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={p.qtdUsada}
                                  onChange={(e) => atualizarQtdManual(i, "qtdUsada", e.target.value)}
                                  className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none"
                                />
                              </div>
                            </div>
                            {devolve > 0 && (
                              <span className="self-start text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                                devolve {devolve.toFixed(2)} ao estoque
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {produtosSelecionados.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">
                      Nenhum produto adicionado. Você pode finalizar sem informar produtos.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setFinalizarModal(null)}
                disabled={finalizarLoading}
                className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarFinalizar}
                disabled={finalizarLoading}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#007EA7] rounded-lg hover:bg-[#006891] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {finalizarLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  "Confirmar e Finalizar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
