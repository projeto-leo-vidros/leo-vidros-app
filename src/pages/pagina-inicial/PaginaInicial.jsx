import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import {
  Info,
  CalendarDays,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import Kpis from "../../components/kpis/Kpis";
import { useDashboardKpis } from "../../hooks/queries/useDashboard";

/**
 * Verifica se uma data corresponde ao dia de hoje.
 * @param {Date|null} date
 * @returns {boolean}
 */
const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Verifica se uma data é hoje ou está no futuro (desconsiderando hora).
 * @param {Date|null} date
 * @returns {boolean}
 */
const isFuture = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Converte uma string de data nos formatos 'dd/MM/yyyy' ou 'yyyy-MM-dd' em um objeto Date.
 * Retorna null para entradas inválidas ou em caso de erro de parsing.
 * @param {string|null|undefined} dateString
 * @returns {Date|null}
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  try {
    if (dateString.includes("/")) {
      const parts = dateString.split("/");
      return new Date(parts[2], parts[1] - 1, parts[0]);
    } else if (dateString.includes("-")) {
      const parts = dateString.split("-");
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    console.error("Erro ao parsear data:", dateString, e);
  }
  return null;
};

export default function PaginaInicial() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ─── Dados do dashboard via TanStack Query ────────────────────────────────
  const {
    qtdAgendamentosHoje,
    qtdAgendamentosFuturos,
    agendamentosFuturos,
    itensCriticos,
    taxaOcupacaoServicos,
    qtdItensCriticos,
    isLoading: loading,
  } = useDashboardKpis();

  const handleEstoqueItemClick = (itemId) => {
    navigate(`/estoque/${itemId}`);
  };

  const handleAgendamentoItemClick = (agendamentoId) => {
    navigate(`/agendamentos?id=${agendamentoId}`);
  };

  const calculatedKpiData = useMemo(
    () => [
      {
        title: "Total de Itens em Baixo Estoque",
        value: qtdItensCriticos,
        icon: Info,
        caption: `${qtdItensCriticos} item(ns) requer atenção`,
      },
      {
        title: "Agendamentos de Hoje",
        value: qtdAgendamentosHoje,
        icon: CalendarDays,
        caption: `${qtdAgendamentosHoje} agendamento(s) hoje`,
      },
      {
        title: "Taxa de Ocupação de Serviços",
        value: `${taxaOcupacaoServicos}%`,
        icon: TrendingUp,
        caption: `${qtdAgendamentosFuturos} agendamentos futuros`,
      },
      {
        title: "Total de Agendamentos Futuros",
        value: qtdAgendamentosFuturos,
        icon: Clock,
        caption: `Próximos serviços`,
      },
    ],
    [
      qtdItensCriticos,
      qtdAgendamentosHoje,
      taxaOcupacaoServicos,
      qtdAgendamentosFuturos,
    ],
  );

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

        <main
          className="flex-1 flex flex-col items-center justify-start px-6 sm:px-8 md:px-10 py-10 gap-10 transition-all duration-300"
          style={{ paddingTop: `${headerHeight + 40}px` }}
        >
          {/* Título */}
          <div className="text-center mb-4 px-2 w-full max-w-[1600px]">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-800 mb-2">
              Painel de Controle
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Visualize todas as informações importantes em um só lugar
            </p>
          </div>

          {/* KPIs */}
          <div className="w-full max-w-[1600px]">
            {loading ? (
              <p>Carregando KPIs...</p>
            ) : (
              <Kpis stats={calculatedKpiData} />
            )}
          </div>

          {/* Seções lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1600px] mx-auto px-2">
            <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-[#003d6b] text-white py-4 px-6 text-center font-semibold text-lg tracking-wide">
                Itens em Estoque Crítico ( Total: {itensCriticos.length} )
              </div>
              <div className="divide-y divide-gray-100 min-h-[200px]">
                {loading ? (
                  <p className="p-6 text-center">Carregando...</p>
                ) : itensCriticos.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">
                    Nenhum item crítico encontrado.
                  </p>
                ) : (
                  itensCriticos.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col md:flex-row items-center justify-between px-6 py-4"
                    >
                      <div className="flex flex-row items-center align-center gap-3 text-center md:text-left">
                        <p className="text-lg font-semibold text-gray-800 text-base">
                          {item.nomeProduto || "Sem nome"}
                        </p>
                        <p className="text-lg text-gray-600">
                          Quantidade: {item.quantidadeTotal} | Mínimo:{" "}
                          {item.nivelMinimo}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        <span
                          className={`text-xg px-4 py-2 rounded-full font-bold ${
                            item.status === "Crítico"
                              ? "bg-red-200 text-black-800"
                              : "bg-yellow-200 text-black-800"
                          }`}
                        >
                          {item.status === "Crítico" ? "Crítico" : "Atenção"}
                        </span>
                        <button
                          title="Ver detalhes do estoque"
                          onClick={() => handleEstoqueItemClick(item.id)}
                          className="border border-gray-300 p-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition text-gray-600 hover:text-[#003d6b]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="bg-[#003d6b] text-white py-4 px-6 text-center font-semibold text-lg tracking-wide">
                Próximos Agendamentos ( Total: {agendamentosFuturos.length} )
              </div>
              <div className="divide-y divide-gray-100 min-h-[200px]">
                {loading ? (
                  <p className="p-6 text-center">Carregando...</p>
                ) : agendamentosFuturos.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">
                    Nenhum agendamento futuro encontrado.
                  </p>
                ) : (
                  agendamentosFuturos.map((ag) => (
                    <div
                      key={ag.idAgendamento}
                      className="flex flex-col md:flex-row items-center justify-between px-6 py-4"
                    >
                      <div className="text-center md:text-left">
                        <p className="font-semibold text-gray-800 text-base">
                          {ag.agendamentoObservacao || "Sem descrição"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Etapa: {ag.status} | Valor: R${" "}
                          {ag.valorTotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        <span className="bg-gray-100 text-gray-700 text-base font-semibold px-5 py-2 rounded-full">
                          {ag.inicioAgendamento}
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-base font-semibold px-5 py-2 rounded-full">
                          {ag.fimAgendamento}
                        </span>
                        <button
                          title="Ver detalhes do agendamento"
                          onClick={() =>
                            handleAgendamentoItemClick(ag.idAgendamento)
                          }
                          className="border border-gray-300 p-1.5 rounded-md hover:bg-gray-100 transition text-gray-600 hover:text-[#003d6b]"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
