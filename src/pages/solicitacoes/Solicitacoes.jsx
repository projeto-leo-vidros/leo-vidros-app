import { useState, useEffect, useMemo } from "react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import {
  Search,
  Check,
  X,
  CheckCheck,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ModalConfirmacao from "../pedidos/components/ModalAceiteOrRecusa/ModalAceiteOrRecusa";
import Api from "../../api/client/Api";
import { StatusSolicitacao, StatusSolicitacaoMap } from "../../types/enums";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";

const ITENS_POR_PAGINA = 10;

export default function Acesso() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [activeTab, setActiveTab] = useState("Pendentes");

  const [modalAberto, setModalAberto] = useState(false);
  const [tipoModal, setTipoModal] = useState(null);
  const [idSelecionado, setIdSelecionado] = useState(null);

  useEffect(() => {
    fetchSolicitacoes();
  }, [activeTab]);

  async function fetchSolicitacoes() {
    setLoading(true);
    try {
      const statusAtual = StatusSolicitacaoMap[activeTab];
      let url;

      if (busca.trim()) {
        url = `/solicitacoes/findAllBy?nome=${encodeURIComponent(busca.trim())}`;
      } else {
        url = `/solicitacoes?status=${statusAtual}`;
      }

      const response = await Api.get(url);
      // A API pode devolver um array direto ou um objeto paginado em `content`
      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.content)
          ? response.data.content
          : [];
      setSolicitacoes(data);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      setSolicitacoes([]);
    } finally {
      setLoading(false);
    }
  }

  const updateSolicitacaoStatus = async (ids, novoStatus) => {
    const promises = ids.map(async (id) => {
      try {
        if (novoStatus === "Aprovado") {
          const response = await Api.put(
            `/solicitacoes/aceitar/${id}`,
            { status: StatusSolicitacao.ACEITO },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
          return response.data;
        } else {
          // Para recusar, usa DELETE
          const response = await Api.delete(`/solicitacoes/recusar/${id}`);
          return response.data;
        }
      } catch (error) {
        console.error(`Erro ao atualizar solicitação ${id}:`, error);
        console.error("Detalhes do erro:", error.response?.data);
        throw error;
      }
    });

    return Promise.all(promises);
  };

  const handleApprove = (id) => {
    setIdSelecionado(id);
    setTipoModal("aprovar");
    setModalAberto(true);
  };

  const handleReject = (id) => {
    setIdSelecionado(id);
    setTipoModal("recusar");
    setModalAberto(true);
  };

  const handleBulkApprove = () => {
    if (selectedItems.length > 0 && activeTab === "Pendentes") {
      setIdSelecionado(null);
      setTipoModal("aprovar");
      setModalAberto(true);
    }
  };

  const handleBulkReject = () => {
    if (selectedItems.length > 0 && activeTab === "Pendentes") {
      setIdSelecionado(null);
      setTipoModal("recusar");
      setModalAberto(true);
    }
  };

  const confirmarAcao = async () => {
    const ids = idSelecionado ? [idSelecionado] : selectedItems;
    const status = tipoModal === "aprovar" ? "Aprovado" : "Recusado";

    try {
      await updateSolicitacaoStatus(ids, status);
      await fetchSolicitacoes();
    } catch (error) {
      console.error("Erro ao atualizar solicitações:", error);
    } finally {
      setModalAberto(false);
      setIdSelecionado(null);
      setTipoModal(null);
      setSelectedItems([]);
    }
  };

  const cancelarAcao = () => {
    setModalAberto(false);
    setIdSelecionado(null);
    setTipoModal(null);
  };

  const handleCheckboxChange = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedSolicitacoes.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setPagina(1);
    setSelectedItems([]);
    setBusca("");
  };

  const filteredSolicitacoes = useMemo(() => {
    const statusAtual = StatusSolicitacaoMap[activeTab];

    let items = busca.trim()
      ? solicitacoes.filter(
          (s) => s.status?.nome?.toUpperCase() === statusAtual.toUpperCase(),
        )
      : solicitacoes;

    if (busca) {
      items = items.filter(
        (s) =>
          s.nome?.toLowerCase().includes(busca.toLowerCase()) ||
          s.cpf?.replace(/[.-]/g, "").includes(busca.replace(/[.-]/g, "")) ||
          s.telefone
            ?.replace(/[\s()-]/g, "")
            .includes(busca.replace(/[\s()-]/g, "")),
      );
    }
    return items;
  }, [solicitacoes, busca, activeTab]);

  const totalPaginas = Math.ceil(
    filteredSolicitacoes.length / ITENS_POR_PAGINA,
  );
  const paginatedSolicitacoes = useMemo(() => {
    const paginaAtual = Math.min(pagina, totalPaginas) || 1;
    const startIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const endIndex = startIndex + ITENS_POR_PAGINA;
    return filteredSolicitacoes.slice(startIndex, endIndex);
  }, [filteredSolicitacoes, pagina, totalPaginas]);

  const paginaAtual = Math.min(pagina, totalPaginas) || 1;
  const startIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const endIndex = Math.min(
    startIndex + ITENS_POR_PAGINA,
    filteredSolicitacoes.length,
  );
  const isAllSelectedOnPage =
    paginatedSolicitacoes.length > 0 &&
    selectedItems.length >= paginatedSolicitacoes.length &&
    paginatedSolicitacoes.every((item) => selectedItems.includes(item.id));

  const getStatusStyle = (statusNome) => {
    switch (statusNome?.toUpperCase()) {
      case "PENDENTE":
        return "bg-yellow-100 text-yellow-800";
      case "ACEITO":
        return "bg-green-100 text-green-800";
      case "RECUSADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="app-page flex min-h-screen" style={{ backgroundColor: "#f7f9fa" }}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="app-content flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="h-[80px]" />

        <main className="flex-1 flex flex-col items-center px-4 md:px-8 pt-6 pb-10 gap-6">
          <div className="w-full max-w-[1380px] flex flex-col gap-8">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold text-gray-800">
                Controle de acesso
              </h1>
              <p className="text-gray-500 text-lg">
                Visualize todas as solicitações de acessos de sua empresa
              </p>
            </div>

            <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full md:w-1/2 lg:w-1/3">
                  <UniversalInput
                    variant="search"
                    placeholder="Buscar Por Nome"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    startIcon={<Search className="w-5 h-5" />}
                  />
                </div>
                {activeTab === "Pendentes" && (
                  <div className="flex gap-2 w-full md:w-auto justify-end relative z-50">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={selectedItems.length === 0}
                      startIcon={<CheckCheck className="w-4 h-4" />}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Aprovar ({selectedItems.length})
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleBulkReject}
                      disabled={selectedItems.length === 0}
                      startIcon={<XCircle className="w-4 h-4" />}
                    >
                      Recusar ({selectedItems.length})
                    </Button>
                  </div>
                )}
              </div>

              <div className="mb-4 border-b border-gray-200">
                <nav
                  className="flex flex-row gap-2 -mb-px flex space-x-6"
                  aria-label="Tabs"
                >
                  {["Pendentes", "Aprovados", "Recusados"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => changeTab(tab)}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm cursor-pointer transition-colors duration-150 ease-in-out focus:outline-none
                            ${
                              activeTab === tab
                                ? "border-[#007EA7] text-[#007EA7]"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                      aria-current={activeTab === tab ? "page" : undefined}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="flex items-center bg-gray-50 border-b border-gray-200 min-h-[48px] rounded-t-md text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="py-3 w-[5%] flex justify-center px-4">
                    {activeTab === "Pendentes" && (
                      <UniversalInput
                        as="checkbox"
                        checked={isAllSelectedOnPage}
                        onChange={handleSelectAllChange}
                      />
                    )}
                  </div>
                  <div className="py-3 w-[20%] px-4">Nome</div>
                  <div className="py-3 w-[15%] px-4">CPF</div>
                  <div className="py-3 w-[15%] px-4">Telefone</div>
                  <div className="py-3 w-[15%] px-4">Email</div>
                  <div className="py-3 w-[15%] px-4 text-center">Situação</div>
                  <div className="py-3 w-[15%] px-4 text-center">Ações</div>
                </div>

                <div>
                  {loading ? (
                    <p className="text-center p-4 text-gray-500">
                      Carregando...
                    </p>
                  ) : paginatedSolicitacoes.length === 0 ? (
                    <p className="text-center p-4 text-gray-500">
                      Nenhuma solicitação encontrada para esta aba.
                    </p>
                  ) : (
                    paginatedSolicitacoes.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center border-b last:border-b-0 hover:bg-gray-50 min-h-[56px] text-sm"
                      >
                        <div className="w-[5%] flex justify-center px-4">
                          {activeTab === "Pendentes" && (
                            <UniversalInput
                              as="checkbox"
                              checked={selectedItems.includes(s.id)}
                              onChange={() => handleCheckboxChange(s.id)}
                            />
                          )}
                        </div>
                        <div className="w-[20%] px-4 text-gray-900 font-medium">
                          {s.nome}
                        </div>
                        <div className="w-[15%] px-4 text-gray-600">
                          {s.cpf}
                        </div>
                        <div className="w-[15%] px-4 text-gray-600">
                          {s.telefone}
                        </div>
                        <div className="w-[15%] px-4 text-gray-600">
                          {s.email || "-"}
                        </div>
                        <div className="w-[15%] px-4 text-center">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(s.status?.nome)}`}
                          >
                            {s.status?.nome}
                          </span>
                        </div>
                        <div className="w-[15%] px-4 text-center flex justify-center gap-2">
                          {activeTab === "Pendentes" ? (
                            <>
                              <button
                                onClick={() => handleApprove(s.id)}
                                title="Aprovar"
                                className="p-1.5 rounded-full text-green-600 cursor-pointer hover:bg-green-100 transition-colors"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(s.id)}
                                title="Recusar"
                                className="p-1.5 rounded-full text-red-600 cursor-pointer hover:bg-red-100 transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>{/* /min-w */}
              </div>

              <ModalConfirmacao
                aberto={modalAberto && tipoModal === "aprovar"}
                tipo="aprovar"
                titulo="Aceitar solicitação de cadastro"
                mensagem="Ao aceitar, esse usuário entrará para o sistema e poderá visualizar todos os dados disponíveis"
                textoBotaoConfirmar="Aceitar"
                onConfirmar={confirmarAcao}
                onCancelar={cancelarAcao}
              />

              <ModalConfirmacao
                aberto={modalAberto && tipoModal === "recusar"}
                tipo="recusar"
                titulo="Recusar solicitação de cadastro"
                mensagem="Ao recusar, o cadastro desse usuário será excluído permanentemente, sendo necessário a abertura de outra solicitação"
                textoBotaoConfirmar="Recusar"
                onConfirmar={confirmarAcao}
                onCancelar={cancelarAcao}
              />

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
                <p className="text-sm text-gray-600">
                  {filteredSolicitacoes.length > 0 ? (
                    <>
                      Mostrando{" "}
                      <span className="font-medium">
                        {startIndex + 1}–{endIndex}
                      </span>{" "}
                      de{" "}
                      <span className="font-medium">
                        {filteredSolicitacoes.length}
                      </span>{" "}
                      resultados
                    </>
                  ) : (
                    "Nenhum resultado"
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPagina((p) => Math.max(p - 1, 1))}
                    disabled={pagina === 1}
                    startIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPagina((p) => Math.min(p + 1, totalPaginas))
                    }
                    disabled={pagina === totalPaginas || totalPaginas === 0}
                    endIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
