import { useState, useEffect, useMemo, useCallback } from "react";
import { usePagination } from "../../hooks/usePagination";
import Api from "../../api/client/Api";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button/Button.component";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ArrowRightLeft,
  Plus
} from "lucide-react";
import NovoProdutoModal from "./components/ModalEstoque/NovoProdutoModal";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import ExportarModal from "./components/ModalEstoque/ExportarModal";
import EstoqueItemRow from "./components/ModalEstoque/EstoqueItemRow";
import FilterDropdown from "./components/EstoqueList/FilterDropdown";
import EntradaSaidaEstoque from "./components/ModalEstoque/EntradaSaidaEstoque";
import InativarProdutoModal from "./components/ModalEstoque/InativarProdutoModal";
import { formatCurrency, parseCurrency } from "../../utils/formatters";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import { repairEncoding } from "../../utils/fixEncoding";

const ITENS_POR_PAGINA = 6;

export default function Estoque() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [estoque, setEstoque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isNovoItemModalOpen, setIsNovoItemModalOpen] = useState(false);
  const [isEntradaSaidaModalOpen, setIsEntradaSaidaModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const [busca, setBusca] = useState("");
  const [selectedFilterDate, _setSelectedFilterDate] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEstoqueId, setSelectedEstoqueId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const focusItemId = location.state?.focusItemId;
  const openMovimentacaoForItemId = location.state?.openMovimentacaoForItemId;

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const mapEstoqueFromApi = useCallback((data) => {
    return data.map((item) => ({
      id: item.id,
      quantidadeTotal: item.quantidadeTotal ?? 0,
      quantidadeDisponivel: item.quantidadeDisponivel ?? 0,
      reservado: item.reservado ?? 0,
      localizacao: item.localizacao || "Não informado",
      produto: {
        id: item.produto.id,
        nome: item.produto.nome,
        descricao: item.produto.descricao || "",
        unidademedida: repairEncoding(item.produto.unidademedida) || "unidade",
        preco: item.produto.preco ?? 0,
        ativo: item.produto.ativo ?? true,

        estoqueMinimo: item.produto.metrica?.nivelMinimo ?? 0,
        estoqueMaximo: item.produto.metrica?.nivelMaximo ?? 0,
        // Atributos do produto
        atributos: item.produto.atributos || [],
        // Campos calculados/compatibilidade
        quantidade: item.quantidadeDisponivel ?? 0,
        tipo:
          item.produto.atributos?.find((attr) => attr.tipo === "categoria")
            ?.valor || "Geral",
      },
    }));
  }, []);

  const fetchEstoque = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await Api.get("/estoques");
      const data = response.data?.content ?? response.data;

      if (!data || data.length === 0) {
        setEstoque([]);
        return;
      }

      const estoqueMapeado = mapEstoqueFromApi(data);
      setEstoque(estoqueMapeado);
    } catch (error) {
      console.error("Erro ao buscar estoque:", error);
      setError("Não foi possível carregar o estoque. Tente novamente.");
      setEstoque([]);
    } finally {
      setLoading(false);
    }
  }, [mapEstoqueFromApi]);

  useEffect(() => {
    fetchEstoque();
  }, [fetchEstoque]);

  const filteredEstoque = useMemo(() => {
    let items = estoque;

    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      items = items.filter(
        (item) =>
          item.produto.nome.toLowerCase().includes(buscaLower) ||
          item.produto.descricao.toLowerCase().includes(buscaLower),
      );
    }

    if (selectedFilterDate) {
      // filtro de data disponível para implementação futura
    }

    const situacaoFilters = activeFilters.situacao || [];
    if (situacaoFilters.length > 0) {
      items = items.filter((item) => {
        const quantidade = item.quantidadeDisponivel;
        const estoqueMinimo = item.produto.estoqueMinimo;
        const reservado = item.reservado;

        let situacao = "";

        if (quantidade === 0 && reservado > 0) {
          situacao = "Reservado";
        } else if (quantidade === 0) {
          situacao = "Fora de estoque";
        } else if (quantidade < estoqueMinimo) {
          situacao = "Abaixo do normal";
        } else {
          situacao = "Disponível";
        }

        return situacaoFilters.includes(situacao);
      });
    }

    const statusFilters = activeFilters.tipo || [];
    if (statusFilters.length > 0) {
      items = items.filter((item) => {
        const statusProduto = item.produto?.ativo ? "Ativo" : "Inativo";
        return statusFilters.includes(statusProduto);
      });
    }

    return items;
  }, [estoque, busca, selectedFilterDate, activeFilters]);

  const {
    page: pagina,
    setPage: setPagina,
    paginated: paginaItems,
    totalPages: totalPaginasHook,
    startIndex,
    endIndex,
    total,
  } = usePagination(filteredEstoque, ITENS_POR_PAGINA);

  const paginationData = {
    items: paginaItems,
    totalPaginas: totalPaginasHook,
    startIndex,
    endIndex,
    total,
  };

  useEffect(() => {
    if (
      focusItemId &&
      filteredEstoque.length > 0 &&
      focusItemId !== expandedItemId
    ) {
      setExpandedItemId(focusItemId);

      const itemIndex = filteredEstoque.findIndex(
        (item) => item.id === focusItemId,
      );

      if (itemIndex !== -1) {
        const targetPage = Math.ceil((itemIndex + 1) / ITENS_POR_PAGINA);

        if (pagina !== targetPage) {
          setPagina(targetPage);
        }

        setTimeout(() => {
          const element = document.getElementById(`item-${focusItemId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [focusItemId, filteredEstoque, expandedItemId, pagina, setPagina]);

  useEffect(() => {
    if (!openMovimentacaoForItemId || loading || filteredEstoque.length === 0) {
      return;
    }

    const itemExists = filteredEstoque.some(
      (item) => item.id === openMovimentacaoForItemId,
    );

    if (!itemExists) {
      return;
    }

    setSelectedItems([openMovimentacaoForItemId]);
    setExpandedItemId(openMovimentacaoForItemId);
    setIsEntradaSaidaModalOpen(true);

    navigate(location.pathname, {
      replace: true,
      state: { focusItemId: openMovimentacaoForItemId },
    });
  }, [
    openMovimentacaoForItemId,
    loading,
    filteredEstoque,
    navigate,
    location.pathname,
  ]);

  const handleSaveItem = useCallback(
    async (itemData) => {
      try {
        if (itemData && itemData.id && itemData.produto) {
          await fetchEstoque();
          setIsNovoItemModalOpen(false);
          setIsSuccessModalOpen(true);

          setTimeout(() => {
            setIsSuccessModalOpen(false);
          }, 3000);
          return;
        }

        const itemPayload = {
          ...itemData,
          preco: parseCurrency(itemData.preco),
          quantidade: parseInt(itemData.quantidade, 10) || 0,
          estoqueMinimo: parseInt(itemData.estoqueMinimo, 10) || 0,
        };

        if (editingItem) {
          await Api.put(`/estoques/${editingItem.id}`, itemPayload);
        }

        await fetchEstoque();

        setIsNovoItemModalOpen(false);
        setIsSuccessModalOpen(true);

        setTimeout(() => {
          setIsSuccessModalOpen(false);
        }, 3000);
      } catch (error) {
        console.error("Erro ao salvar item:", error);
        alert("Erro ao salvar item. Tente novamente.");
      }
    },
    [editingItem, fetchEstoque],
  );

  // Novo callback para lidar com o sucesso do modal de produto
  const handleProductSuccess = useCallback(
    async (_savedProduct) => {
      // Recarregar o estoque para mostrar o novo produto
      await fetchEstoque();

      // Fechar modal e mostrar sucesso
      setIsNovoItemModalOpen(false);
      setIsSuccessModalOpen(true);

      setTimeout(() => {
        setIsSuccessModalOpen(false);
      }, 3000);
    },
    [fetchEstoque],
  );

  const handleViewDetails = useCallback(
    (estoqueId) => {
      if (!estoqueId) {
        console.error("Erro: ID do estoque é undefined!");
        return;
      }
      navigate(`/estoque/${estoqueId}`);
    },
    [navigate],
  );

  const handleSaveMovement = useCallback(
    async (itemIds, movementData) => {
      try {
        const updates = itemIds.map(async (estoqueId) => {
          const itemToUpdate = estoque.find((item) => item.id === estoqueId);
          if (!itemToUpdate) return;

          const newQuantity =
            movementData.tipo === "Entrada"
              ? itemToUpdate.quantidadeDisponivel + movementData.quantidade
              : itemToUpdate.quantidadeDisponivel - movementData.quantidade;

          const updatedItem = {
            ...itemToUpdate,
            quantidadeDisponivel: Math.max(0, newQuantity),
            quantidadeTotal: Math.max(0, newQuantity),
          };

          return Api.put(`/estoques/${estoqueId}`, updatedItem);
        });

        await Promise.all(updates);
        await fetchEstoque();

        setIsEntradaSaidaModalOpen(false);
        setSelectedItems([]);
      } catch (error) {
        console.error("Falha ao salvar movimentos:", error);
        alert("Erro ao registrar movimento. Tente novamente.");
      }
    },
    [estoque, fetchEstoque],
  );

  const confirmarInativacao = useCallback(async () => {
    try {
      await Api.put(`/produtos/stand-by/${selectedEstoqueId}`, {
        status: false,
      });

      await fetchEstoque();

      setModalOpen(false);
    } catch (error) {
      console.error("Erro ao inativar item:", error);
      alert("Erro ao inativar item. Tente novamente.");
    }
  }, [selectedEstoqueId, fetchEstoque]);

  const handleDeleteItem = useCallback((estoqueId) => {
    setSelectedEstoqueId(estoqueId);
    setModalOpen(true);
  }, []);

  const openNewItemModal = useCallback(() => {
    setEditingItem(null);
    setIsNovoItemModalOpen(true);
  }, []);

  const openEditItemModal = useCallback((item) => {
    setEditingItem(item);
    setIsNovoItemModalOpen(true);
  }, []);

  const openEntradaSaidaModal = useCallback(() => {
    setIsEntradaSaidaModalOpen(true);
  }, []);

  const closeEntradaSaidaModal = useCallback(() => {
    setIsEntradaSaidaModalOpen(false);
  }, []);

  const handleMovementComplete = useCallback(async () => {
    await fetchEstoque();
    setSelectedItems([]);
    setIsEntradaSaidaModalOpen(false);
  }, [fetchEstoque]);

  const openExportModal = useCallback(() => {
    setIsExportModalOpen(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const closeSuccessModal = useCallback(() => {
    setIsSuccessModalOpen(false);
  }, []);

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  }, []);

  const handleSelectAllChange = useCallback(
    (e) => {
      if (e.target.checked) {
        setSelectedItems(paginationData.items.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [paginationData.items],
  );

  const handleFilterChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
  }, []);

  const handleCollapseItem = useCallback(() => {
    setExpandedItemId(null);
  }, []);

  const hasActiveFilters = useMemo(
    () => Object.values(activeFilters).some((arr) => arr && arr.length > 0),
    [activeFilters],
  );

  const isAllSelectedOnPage = useMemo(() => {
    return (
      paginationData.items.length > 0 &&
      selectedItems.length >= paginationData.items.length &&
      paginationData.items.every((item) => selectedItems.includes(item.id))
    );
  }, [paginationData.items, selectedItems]);

  const renderedItems = useMemo(() => {
    return paginationData.items.map((item) => {
      const quantidade = item.quantidadeDisponivel;
      const estoqueMinimo = item.produto.estoqueMinimo;
      const reservado = item.reservado;

      let situacao = "";

      if (quantidade === 0 && reservado > 0) {
        situacao = "Reservado";
      } else if (quantidade === 0) {
        situacao = "Fora de estoque";
      } else if (quantidade < estoqueMinimo) {
        situacao = "Abaixo do normal";
      } else {
        situacao = "Disponível";
      }

      return {
        ...item,
        situacao,
        produto: {
          ...item.produto,
          preco: formatCurrency(item.produto.preco),
        },
      };
    });
  }, [paginationData.items]);

  return (
    <div className="app-page flex bg-[#f7f9fa] min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="app-content flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="pt-20" />

        <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-10 gap-6">
          {/* Cabeçalho */}
          <div className="text-center w-full max-w-[1380px] mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
              Controle de Estoque
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Gerencie produtos e estoque de forma eficiente.
            </p>
          </div>

          <div className="w-full max-w-[1380px] mx-auto flex flex-col gap-6">
            {/* Tabela de Estoque */}
            <div className="flex flex-col gap-6 bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
              {/* Barra de ações */}
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={openNewItemModal}
                    startIcon={<Plus size={24} />}
                    className="bg-[#007EA7] text-white font-semibold py-2 px-5 rounded-md hover:bg-[#006891] transition-colors flex items-center justify-center whitespace-nowrap gap-2 cursor-pointer"
                  >
                    Novo Produto
                  </Button>
                  <div className="relative inline-flex group">
                    <Button
                      onClick={openEntradaSaidaModal}
                      disabled={selectedItems.length === 0}
                      className="bg-blue-600 text-white font-medium py-2.5 px-5 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center whitespace-nowrap gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Registrar Movimento
                    </Button>

                    {selectedItems.length === 0 && (
                      <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-64 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        Selecione um produto para registrar a movimentacao
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 lg:ml-auto">
                  <div className="relative w-full sm:w-[320px] sm:max-w-md">
                    <UniversalInput
                      variant="search"
                      placeholder="Busque Por Nome ou Descricao..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      startIcon={<Search className="w-5 h-5" />}
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-2 border border-gray-300 py-2.5 px-4 rounded-md text-sm text-gray-700 font-medium cursor-pointer hover:bg-gray-50 transition-colors ${
                        hasActiveFilters
                          ? "border-[#003d6b] text-[#003d6b] bg-[#e6f0f5]"
                          : ""
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      Filtrar
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isFilterOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <FilterDropdown
                      isOpen={isFilterOpen}
                      onClose={() => setIsFilterOpen(false)}
                      selectedFilters={activeFilters}
                      onFilterChange={handleFilterChange}
                    />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={openExportModal}
                    startIcon={<Download className="w-4 h-4" />}
                  >
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Tabela */}
              <div className="overflow-x-auto">
                <div className="min-w-[640px]">
                {/* Cabeçalho da tabela */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 mb-2 min-h-48px rounded-t-md text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="py-3 w-[5%] pl-4 pr-1">
                    <UniversalInput
                      as="checkbox"
                      checked={isAllSelectedOnPage}
                      onChange={handleSelectAllChange}
                    />
                  </div>
                  <div className="py-3 w-[20%] sm:w-[15%] pl-2 pr-1">Nome</div>
                  <div className="py-3 w-[12%] sm:w-[10%] text-center">Preço</div>
                  <div className="hidden md:block py-3 w-[15%] px-4">Unidade de Medida</div>
                  <div className="py-3 w-[20%] text-center">
                    Qtd. Estoque
                  </div>
                  <div className="py-3 w-[13%] sm:w-[10%] text-center">Status</div>
                  <div className="hidden sm:block py-3 w-[10%] text-center">Situação</div>
                  <div className="py-3 w-[30%] sm:w-[15%] text-right pr-8">Ações</div>
                </div>

                {/* Linhas da tabela */}
                <div>
                  {loading ? (
                    <div className="text-center p-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#007EA7]"></div>
                      <p className="mt-2 text-gray-600">Carregando...</p>
                    </div>
                  ) : renderedItems.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <p>Nenhum item encontrado.</p>
                      {busca && (
                        <button
                          onClick={() => setBusca("")}
                          className="mt-2 text-[#007EA7] hover:underline"
                        >
                          Limpar busca
                        </button>
                      )}
                    </div>
                  ) : (
                    renderedItems.map((item) => (
                      <EstoqueItemRow
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.includes(item.id)}
                        onToggle={() => handleCheckboxChange(item.id)}
                        onEdit={() => openEditItemModal(item)}
                        onDelete={() => handleDeleteItem(item.id)}
                        onViewDetails={() => handleViewDetails(item.id)}
                        isInitiallyExpanded={item.id === expandedItemId}
                        onCollapse={handleCollapseItem}
                      />
                    ))
                  )}
                </div>
                </div>{/* /min-w */}
              </div>

              {/* Paginação */}
              {!loading && paginationData.total > 0 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
                  <p>
                    Mostrando{" "}
                    <span className="font-medium">
                      {paginationData.total > 0
                        ? paginationData.startIndex + 1
                        : 0}
                      -{paginationData.endIndex}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium">{paginationData.total}</span>{" "}
                    resultados
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                      disabled={pagina === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPagina((p) =>
                          Math.min(p + 1, paginationData.totalPaginas),
                        )
                      }
                      disabled={
                        pagina === paginationData.totalPaginas ||
                        paginationData.totalPaginas === 0
                      }
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      <NovoProdutoModal
        isOpen={isNovoItemModalOpen}
        onClose={() => setIsNovoItemModalOpen(false)}
        onSave={handleSaveItem}
        onSuccess={handleProductSuccess}
        item={editingItem}
      />

      <EntradaSaidaEstoque
        isOpen={isEntradaSaidaModalOpen}
        onClose={closeEntradaSaidaModal}
        onSave={handleSaveMovement}
        itemIds={selectedItems}
        estoque={estoque}
        onMovementComplete={handleMovementComplete}
      />

      <InativarProdutoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmarInativacao}
      />

      <FeedbackModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        type="success"
        title="Produto salvo com sucesso"
        description="O produto foi atualizado no sistema"
        duration={3000}
      />

      <ExportarModal isOpen={isExportModalOpen} onClose={closeExportModal} />
    </div>
  );
}
