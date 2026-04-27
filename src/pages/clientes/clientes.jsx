import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import { Search, Upload, Edit, Eye, Plus } from "lucide-react";
import ClienteFormModal from "./components/ClienteFormModal";
import ClienteDetailsModal from "./components/ClienteDetailsModal";
import ClienteImportModal from "./components/ClienteImportModal";
import { Divider } from "@mui/material";
import Api from "../../api/client/Api";
import { formatCurrency, formatPhone } from "../../utils/formatters";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";

const normalizeClienteStatus = (status) => {
  const normalized = String(status ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (normalized === "ATIVO") return "Ativo";
  if (normalized === "INATIVO") return "Inativo";
  if (normalized === "FINALIZADO") return "Finalizado";

  return status || "Inativo";
};

const InfoItem = ({ label, value }) => (
  <div className="text-left">
    <span className="block text-gray-500 font-medium uppercase text-xs mb-1">
      {label}
    </span>
    <span className="text-gray-900 font-medium text-sm">{value || "N/A"}</span>
  </div>
);

const _HistoryCard = ({ hist }) => (
  <div className="w-full p-6 border border-gray-200 rounded-2xl bg-white">
    <div className="flex flex-col md:flex-row justify-between mb-4">
      <div className="max-w-[65%]">
        <span className="text-gray-500 uppercase text-xs tracking-wide">
          Serviço
        </span>
        <h3 className="text-gray-900 font-semibold text-lg leading-snug">
          {hist.servico}
        </h3>
      </div>
      <div className="text-right min-w-[100px]">
        <span className="text-gray-500 uppercase text-xs tracking-wide">
          Valor
        </span>
        <h3 className="text-green-700 font-semibold text-lg">
          {formatCurrency(hist.valor)}
        </h3>
      </div>
    </div>

    <Divider className="mb-6" />

    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pt-4">
      <InfoItem label="Data Orçamento" value={hist.dataOrcamento} />
      <InfoItem label="Data Serviço" value={hist.dataServico} />
      <InfoItem label="Pagamento" value={hist.formaPagamento} />
      <InfoItem label="Desconto" value={`${hist.desconto}%`} />
      <InfoItem label="Funcionário" value={hist.funcionario} />
    </div>
  </div>
);

export default function Clientes() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const limitePorPagina = 5;

  const [situacao, setSituacao] = useState("Todos");
  const [ordenar, setOrdenar] = useState("recentes");

  const [openForm, setOpenForm] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openImportModal, setOpenImportModal] = useState(false);

  const [openDetails, setOpenDetails] = useState(false);
  const [clienteDetalhes, setClienteDetalhes] = useState(null);

  const [pedidos, setPedidos] = useState([]);

  const fetchClientes = async () => {
    try {
      const response = await Api.get("/clientes");
      const data = response.data?.content ?? response.data;
      setClientes(
        Array.isArray(data)
          ? data.map((cliente) => ({
              ...cliente,
              status: normalizeClienteStatus(cliente.status),
            }))
          : [],
      );
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setClientes([]);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await Api.get("/pedidos");
      const data = response.data?.content ?? response.data;
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setPedidos([]);
    }
  };

  useEffect(() => {
    fetchClientes();
    fetchPedidos();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const clientesArray = Array.isArray(clientes) ? clientes : [];

    let filtered = clientesArray.filter((c) => {
      return c.nome && c.nome.toLowerCase().includes(busca.toLowerCase());
    });
    if (situacao !== "Todos")
      filtered = filtered.filter((c) => c.status === situacao);

    return filtered.sort((a, b) => {
      if (ordenar === "recentes") return b.id - a.id;
      if (ordenar === "antigos") return a.id - b.id;
      if (ordenar === "az")
        return a.nome && b.nome ? a.nome.localeCompare(b.nome) : 0;
      if (ordenar === "za")
        return a.nome && b.nome ? b.nome.localeCompare(a.nome) : 0;
      return 0;
    });
  }, [clientes, busca, situacao, ordenar]);

  const indexUltimo = pagina * limitePorPagina;
  const indexPrimeiro = indexUltimo - limitePorPagina;
  const clientesPagina = clientesFiltrados.slice(indexPrimeiro, indexUltimo);
  const totalPaginas = Math.ceil(clientesFiltrados.length / limitePorPagina);

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setClienteSelecionado(null);
    setOpenForm(true);
  };

  const abrirModalEditar = (cliente) => {
    setModoEdicao(true);
    setClienteSelecionado(cliente);
    setOpenForm(true);
  };

  const atualizarClientes = async (dadosCliente) => {
    const statusAnterior = clienteSelecionado?.status;
    if (modoEdicao && clienteSelecionado) {
      try {
        const enderecoExistente = clienteSelecionado?.enderecos?.[0];
        const enderecoAtualizado = dadosCliente.enderecos?.[0]
          ? { ...(enderecoExistente?.id ? { id: enderecoExistente.id } : {}), ...dadosCliente.enderecos[0] }
          : enderecoExistente;

        const clienteAtualizado = {
          ...clienteSelecionado,
          ...dadosCliente,
          enderecos: enderecoAtualizado ? [enderecoAtualizado] : [],
        };

        const response = await Api.put(
          `/clientes/${clienteSelecionado.id}`,
          clienteAtualizado,
        );

        const clienteRetornado = {
          ...response.data,
          status: normalizeClienteStatus(response.data?.status),
        };

        setClientes((prev) =>
          prev.map((c) =>
            c.id === clienteSelecionado.id ? clienteRetornado : c,
          ),
        );

        setOpenForm(false);

        if (dadosCliente.status === "Ativo" && statusAnterior !== "Ativo") {
          navigate("/Pedidos", {
            state: {
              initialTab: "servicos",
              autoTriggerNovo: true,
              clienteInicial: clienteRetornado,
            },
          });
        }
      } catch (error) {
        console.error("Erro ao editar cliente (PUT):", error);
        setOpenForm(false);
      }
    } else {
      try {
        const novoClienteComId = { ...dadosCliente };

        const response = await Api.post("/clientes", novoClienteComId);

        const novoCliente = {
          ...response.data,
          status: normalizeClienteStatus(response.data?.status),
        };
        setClientes((prev) => [novoCliente, ...prev]);

        setOpenForm(false);

        if (dadosCliente.status === "Ativo") {
          navigate("/Pedidos", {
            state: {
              initialTab: "servicos",
              autoTriggerNovo: true,
              clienteInicial: novoCliente,
            },
          });
        }
      } catch (error) {
        console.error("Erro ao criar cliente (POST):", error);
        setOpenForm(false);
      }
    }
  };

  const _abrirModalVisualizar = (cliente) => {
    setClienteDetalhes(cliente);
    setOpenDetails(true);
  };

  const handleImportSuccess = () => {
    fetchClientes();
    setOpenImportModal(false);
  };

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
              Clientes
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Visualize e gerencie todos os clientes de sua empresa
            </p>
          </div>

          <div className="w-full max-w-[1380px] mx-auto">
            {/* Tabela de Clientes */}
            <div className="flex flex-col gap-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
              {/* Barra de ações */}
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex shrink-0">
                  <Button
                    variant="primary"
                    onClick={abrirModalCriar}
                    startIcon={<Plus className="w-6 h-6" />}
                  >
                    Novo Cliente
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 lg:ml-auto">
                  <div className="relative w-full sm:w-[320px] sm:max-w-md">
                    <UniversalInput
                      variant="search"
                      placeholder="Busque por nome..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      startIcon={<Search className="w-5 h-5" />}
                    />
                  </div>
                  <UniversalInput
                    as="select"
                    value={ordenar}
                    onChange={(e) => setOrdenar(e.target.value)}
                    options={[
                      { value: "recentes", label: "Recentes" },
                      { value: "antigos", label: "Antigos" },
                      { value: "az", label: "A-Z" },
                      { value: "za", label: "Z-A" },
                    ]}
                  />
                  <UniversalInput
                    as="select"
                    value={situacao}
                    onChange={(e) => setSituacao(e.target.value)}
                    options={[
                      { value: "Todos", label: "Todos" },
                      { value: "Ativo", label: "Ativo" },
                      { value: "Inativo", label: "Inativo" },
                      { value: "Finalizado", label: "Finalizado" },
                    ]}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => setOpenImportModal(true)}
                    startIcon={<Upload className="w-4 h-4" />}
                  >
                    Importar
                  </Button>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                {/* Cabeçalho da tabela */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 mb-2 min-h-48px rounded-t-md text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="py-3 w-[30%] sm:w-[25%] pl-2 pr-1">Nome</div>
                  <div className="py-3 w-[20%] sm:w-[15%] px-4">Contato</div>
                  <div className="hidden md:block py-3 w-[20%] px-4">Email</div>
                  <div className="py-3 w-[20%] sm:w-[15%] text-center">Status</div>
                  <div className="hidden sm:block py-3 w-[10%] text-center">Serviços</div>
                  <div className="py-3 w-[25%] sm:w-[10%] text-right pr-8">Ações</div>
                </div>

                {/* Linhas da tabela */}
                <div>
                  {clientesPagina.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <p>
                        {busca
                          ? "Nenhum resultado encontrado."
                          : "Nenhum cliente cadastrado."}
                      </p>
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
                    clientesPagina.map((c) => {
                      const qtdPedidos = pedidos.filter(
                        (p) => p.cliente?.id === c.id,
                      ).length;

                      return (
                        <React.Fragment key={c.id}>
                          <div
                            className="flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <div className="py-3 w-[30%] sm:w-[25%] pl-2 pr-1 text-sm text-gray-900 truncate">
                              {c.nome}
                            </div>
                            <div className="py-3 w-[20%] sm:w-[15%] px-4 text-sm text-gray-600 truncate">
                              {formatPhone(c.telefone)}
                            </div>
                            <div className="hidden md:block py-3 w-[20%] px-4 text-sm text-gray-600 truncate">
                              {c.email}
                            </div>
                            <div className="py-3 w-[20%] sm:w-[15%] text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs sm:text-sm font-medium ${
                                  c.status === "Ativo"
                                    ? "bg-green-100 text-green-800"
                                    : c.status === "Inativo"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {c.status}
                              </span>
                            </div>
                            <div className="hidden sm:block py-3 w-[10%] text-center text-sm text-gray-900">
                              {qtdPedidos}
                            </div>
                            <div className="py-3 w-[25%] sm:w-[10%] text-right pr-8">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    abrirModalEditar(c);
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-[#007EA7] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setClienteDetalhes(c);
                                    setOpenDetails(true);
                                  }}
                                  className="p-1.5 text-gray-600 hover:text-[#007EA7] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                  title="Visualizar detalhes"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </div>
                </div>{/* /min-w */}
              </div>

              {/* Paginação */}
              {clientesFiltrados.length > 0 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">
                  <p>
                    Mostrando{" "}
                    <span className="font-medium">
                      {clientesFiltrados.length > 0 ? indexPrimeiro + 1 : 0}-
                      {Math.min(indexUltimo, clientesFiltrados.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium">
                      {clientesFiltrados.length}
                    </span>{" "}
                    resultados
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPagina((prev) => Math.max(prev - 1, 1))}
                      disabled={pagina === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPagina((prev) => Math.min(prev + 1, totalPaginas))
                      }
                      disabled={pagina === totalPaginas}
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
      <ClienteFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={atualizarClientes}
        modoEdicao={modoEdicao}
        clienteInicial={clienteSelecionado}
      />

      <ClienteDetailsModal
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        cliente={clienteDetalhes}
        servicos={Array.isArray(pedidos) ? pedidos : []}
      />

      <ClienteImportModal
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
