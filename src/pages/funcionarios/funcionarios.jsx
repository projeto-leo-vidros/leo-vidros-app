import { useState, useEffect } from "react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import { Search, Edit, Trash2, CalendarDays, Plus } from "lucide-react";

import FuncionarioForm from "./components/ModalFuncionarios/FuncionarioForm";
import DeleteFuncionario from "./components/ModalFuncionarios/DeleteFuncionario";
import AgendaFuncionario from "./components/ModalFuncionarios/AgendaFuncionario";
import Api from "../../api/client/Api";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";

export default function Funcionarios() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const limitePorPagina = 6;

  const [openForm, setOpenForm] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [funcionarioParaDeletar, setFuncionarioParaDeletar] = useState(null);

  const [openAgenda, setOpenAgenda] = useState(false);
  const [funcionarioAgenda, setFuncionarioAgenda] = useState(null);

  const [selecionados, setSelecionados] = useState([]);

  const fetchFuncionarios = async () => {
    try {
      const response = await Api.get("/funcionarios");
      const data = response.data?.content ?? response.data;
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setFuncionarios([]);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  const funcionariosFiltrados = Array.isArray(funcionarios)
    ? funcionarios.filter(
        (f) => f.nome && f.nome.toLowerCase().includes(busca.toLowerCase()),
      )
    : [];

  const indexUltimo = pagina * limitePorPagina;
  const indexPrimeiro = indexUltimo - limitePorPagina;
  const funcionariosPagina = funcionariosFiltrados.slice(
    indexPrimeiro,
    indexUltimo,
  );
  const totalPaginas = Math.ceil(
    funcionariosFiltrados.length / limitePorPagina,
  );

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setFuncionarioSelecionado(null);
    setOpenForm(true);
  };

  const abrirModalEditar = (funcionario) => {
    setModoEdicao(true);
    setFuncionarioSelecionado(funcionario);
    setOpenForm(true);
  };

  const abrirModalDeletar = (funcionario) => {
    setFuncionarioParaDeletar(funcionario);
    setOpenDelete(true);
  };

  const abrirAgenda = (funcionario) => {
    setFuncionarioAgenda(funcionario);
    setOpenAgenda(true);
  };

  const atualizarFuncionarios = async (novoFunc) => {
    try {
      if (modoEdicao && funcionarioSelecionado) {
        const funcAtualizado = { ...funcionarioSelecionado, ...novoFunc };
        await Api.put(
          `/funcionarios/${funcionarioSelecionado.id}`,
          funcAtualizado,
        );
      } else {
        await Api.post("/funcionarios", novoFunc);
      }
      fetchFuncionarios();
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
    }
  };

  const deletarFuncionario = async (id) => {
    try {
      await Api.delete(`/funcionarios/${id}`);
      setFuncionarios((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Erro ao deletar funcionário:", error);
    }
  };

  const isSelected = (id) => selecionados.indexOf(id) !== -1;

  const handleSelectClick = (event, id) => {
    const selectedIndex = selecionados.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selecionados, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selecionados.slice(1));
    } else if (selectedIndex === selecionados.length - 1) {
      newSelected = newSelected.concat(selecionados.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selecionados.slice(0, selectedIndex),
        selecionados.slice(selectedIndex + 1),
      );
    }

    setSelecionados(newSelected);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = funcionariosFiltrados.map((n) => n.id);
      setSelecionados(newSelected);
      return;
    }
    setSelecionados([]);
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
              Controle de Funcionários
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Gerencie todos os funcionários de sua empresa
            </p>
          </div>

          <div className="w-full max-w-[1380px] mx-auto">
            <div className="flex flex-col gap-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
              {/* Barra de ações */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <Button
                  variant="primary"
                  onClick={abrirModalCriar}
                  startIcon={<Plus className="w-6 h-6" />}
                >
                  Novo Funcionário
                </Button>

                <div className="relative w-full md:max-w-md">
                  <UniversalInput
                    variant="search"
                    placeholder="Busque por nome..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    startIcon={<Search className="w-5 h-5" />}
                  />
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-x-auto">
                <div className="min-w-[580px]">
                {/* Cabeçalho da tabela */}
                <div className="flex items-center bg-gray-50 border-b border-gray-200 mb-2 min-h-12 rounded-t-md text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="py-3 w-[5%] pl-4">
                    <UniversalInput
                      as="checkbox"
                      checked={
                        funcionariosFiltrados.length > 0 &&
                        selecionados.length === funcionariosFiltrados.length
                      }
                      onChange={handleSelectAllClick}
                    />
                  </div>
                  <div className="py-3 w-[18%] pl-2">Nome</div>
                  <div className="py-3 w-[14%]">Telefone</div>
                  <div className="py-3 w-[14%]">Função</div>
                  <div className="hidden md:block py-3 w-[12%]">Escala</div>
                  <div className="hidden md:block py-3 w-[12%]">Contrato</div>
                  <div className="py-3 w-[12%] text-center">Status</div>
                  <div className="py-3 w-[22%] text-center">Ações</div>
                </div>

                {/* Linhas da tabela */}
                <div>
                  {funcionariosPagina.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <p>Nenhum funcionário encontrado.</p>
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
                    funcionariosPagina.map((f) => {
                      const isItemSelected = isSelected(f.id);

                      return (
                        <div
                          key={f.id}
                          className={`flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                            isItemSelected ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="py-3 w-[5%] pl-4">
                            <UniversalInput
                              as="checkbox"
                              checked={isItemSelected}
                              onChange={(event) =>
                                handleSelectClick(event, f.id)
                              }
                            />
                          </div>
                          <div className="py-3 w-[18%] pl-2 text-sm text-gray-900 truncate">
                            {f.nome}
                          </div>
                          <div className="py-3 w-[14%] text-sm text-gray-600 truncate">
                            {f.telefone}
                          </div>
                          <div className="py-3 w-[14%] text-sm text-gray-600 truncate">
                            {f.funcao}
                          </div>
                          <div className="hidden md:block py-3 w-[12%] text-sm text-gray-600 truncate">
                            {f.escala || "N/A"}
                          </div>
                          <div className="hidden md:block py-3 w-[12%] text-sm text-gray-600 truncate">
                            {f.contrato}
                          </div>
                          <div className="py-3 w-[12%] text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                f.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {f.status ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <div className="py-3 w-[22%] pr-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirAgenda(f);
                                }}
                                className="p-2 text-gray-600 hover:text-[#007EA7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Ver Agenda"
                              >
                                <CalendarDays className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalEditar(f);
                                }}
                                className="p-2 text-gray-600 hover:text-[#007EA7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalDeletar(f);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Deletar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                </div>{/* /min-w */}
              </div>

              {/* Paginação */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 text-sm text-gray-600">
                <span>
                  Mostrando {indexPrimeiro + 1} a{" "}
                  {Math.min(indexUltimo, funcionariosFiltrados.length)} de{" "}
                  {funcionariosFiltrados.length} resultados
                </span>
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
            </div>
          </div>
        </main>
      </div>

      <FuncionarioForm
        open={openForm}
        setOpen={setOpenForm}
        modoEdicao={modoEdicao}
        funcionario={funcionarioSelecionado}
        salvarFuncionario={atualizarFuncionarios}
      />

      <DeleteFuncionario
        open={openDelete}
        setOpen={setOpenDelete}
        funcionario={funcionarioParaDeletar}
        deletarFuncionario={deletarFuncionario}
      />

      <AgendaFuncionario
        open={openAgenda}
        setOpen={setOpenAgenda}
        funcionario={funcionarioAgenda}
      />
    </div>
  );
}
