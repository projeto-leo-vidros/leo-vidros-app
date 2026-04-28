import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  CircleDollarSign,
  ExternalLink,
  FileText,
  PackageSearch,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Kpis from "../../components/kpis/Kpis";
import FaturamentoAnualModal from "../../components/kpis/FaturamentoAnualModal";
import OrcamentosAbertosModal from "../../components/kpis/OrcamentosAbertosModal";
import { useDashboardKpis } from "../../hooks/queries/useDashboard";

export default function PaginaInicial() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [faturamentoModalOpen, setFaturamentoModalOpen] = useState(false);
  const [orcamentosModalOpen, setOrcamentosModalOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleOpenFaturamentoModal = useCallback(() => setFaturamentoModalOpen(true), []);
  const handleOpenOrcamentosModal = useCallback(() => setOrcamentosModalOpen(true), []);

  const {
    faturamentoMes,
    percentualFaturamento,
    qtdAgendamentosHoje,
    qtdAgendamentosFuturos,
    agendamentosFuturos = [],
    itensCriticos = [],
    qtdItensCriticos,
    orcamentosAberto,
    valorOrcamentosAberto,
    isLoading: loading,
  } = useDashboardKpis();

  const handleAgendamentoItemClick = (agendamentoId) => {
    navigate(`/agendamentos?id=${agendamentoId}`);
  };

  const handleEstoqueItemClick = (itemId) => {
    navigate("/estoque", {
      state: {
        focusItemId: itemId,
        openMovimentacaoForItemId: itemId,
      },
    });
  };

  const formatHorarioAgendamento = (inicio, fim) => {
    const toHourMinute = (valor) => {
      if (!valor) return "";
      return String(valor).substring(0, 5);
    };

    const horarioInicio = toHourMinute(inicio);
    const horarioFim = toHourMinute(fim);

    if (horarioInicio && horarioFim) {
      return `${horarioInicio} - ${horarioFim}`;
    }

    return horarioInicio || horarioFim || "--:--";
  };

  const formatDiaMesAgendamento = (dataAgendamento) => {
    if (!dataAgendamento) return "--/--";

    const [ano, mes, dia] = String(dataAgendamento).split("-");

    if (!ano || !mes || !dia) return "--/--";

    return `${dia}/${mes}`;
  };

  const agendamentosDaSemana = useMemo(() => {
    const hoje = new Date();
    const inicioDaSemana = new Date(hoje);
    const diaDaSemana = hoje.getDay();
    const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

    inicioDaSemana.setDate(hoje.getDate() + diffParaSegunda);
    inicioDaSemana.setHours(0, 0, 0, 0);

    const fimDaSemana = new Date(inicioDaSemana);
    fimDaSemana.setDate(inicioDaSemana.getDate() + 6);
    fimDaSemana.setHours(23, 59, 59, 999);

    return agendamentosFuturos.filter((agendamento) => {
      if (!agendamento?.dataAgendamento) return false;

      const dataNormalizada = String(agendamento.dataAgendamento).split("T")[0];
      const dataAgendamento = new Date(`${dataNormalizada}T12:00:00`);

      if (Number.isNaN(dataAgendamento.getTime())) return false;

      return dataAgendamento >= inicioDaSemana && dataAgendamento <= fimDaSemana;
    });
  }, [agendamentosFuturos]);

  const mesAtual = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const calculatedKpiData = useMemo(
    () => [
      {
        title: "Faturamento do mes",
        value: faturamentoMes ? `R$ ${Number(faturamentoMes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0",
        icon: CircleDollarSign,
        caption: mesAtual.charAt(0).toUpperCase() + mesAtual.slice(1),
        trend: percentualFaturamento != null
          ? `${percentualFaturamento > 0 ? "+" : ""}${percentualFaturamento}%`
          : "",
        color: "blue",
        onClick: handleOpenFaturamentoModal,
      },
      {
        title: "Agendamentos de Hoje",
        value: qtdAgendamentosHoje || 0,
        icon: Calendar,
        caption: `${qtdAgendamentosFuturos || 0} agendamentos nos proximos dias`,
        color: "green",
      },
      {
        title: "Itens em Baixo Estoque",
        value: qtdItensCriticos || 0,
        icon: PackageSearch,
        caption: `${qtdItensCriticos || 0} itens requerem atenção`,
        color: "orange",
      },
      {
        title: "Orcamentos em Aberto",
        value: orcamentosAberto || 0,
        icon: FileText,
        caption: valorOrcamentosAberto
          ? `R$ ${Number(valorOrcamentosAberto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em negociacao`
          : "R$ 0 em negociacao",
        color: "purple",
        onClick: handleOpenOrcamentosModal,
      },
    ],
    [
      faturamentoMes,
      percentualFaturamento,
      qtdAgendamentosHoje,
      qtdAgendamentosFuturos,
      qtdItensCriticos,
      orcamentosAberto,
      valorOrcamentosAberto,
      mesAtual,
      handleOpenFaturamentoModal,
      handleOpenOrcamentosModal,
    ],
  );

  return (
    <div className="flex min-h-screen bg-[#f7f9fa]">
      {faturamentoModalOpen && (
        <FaturamentoAnualModal onClose={() => setFaturamentoModalOpen(false)} />
      )}
      {orcamentosModalOpen && (
        <OrcamentosAbertosModal onClose={() => setOrcamentosModalOpen(false)} />
      )}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="app-content flex min-h-screen flex-1 flex-col">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="pt-20" />

        <main className="flex-1 flex flex-col items-center px-4 pt-6 pb-10 gap-[3.75rem] md:px-8">
          <div className="mx-auto w-full max-w-[1380px] text-center">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 sm:text-3xl md:text-4xl">
              Painel de Controle
            </h1>
            <p className="text-sm text-gray-500 sm:text-base">
              Visualize todas as informações importantes em um só lugar
            </p>
          </div>

          <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-[3.75rem]">
            {qtdItensCriticos > 0 && (
              <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-[#ffe08a] bg-[#fff7db] px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#856404]" />
                  <p className="text-sm text-[#856404]">
                    <strong>Atenção:</strong> {qtdItensCriticos} produtos precisam de
                    reposição no estoque.
                  </p>
                </div>
                <span className="rounded-full bg-[#856404] px-3 py-1 text-sm font-semibold text-white">
                  {qtdItensCriticos}
                </span>
              </div>
            )}

            <div className="w-full">
              {loading ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-gray-100 bg-white">
                  <span className="animate-pulse text-gray-400">
                    Carregando indicadores...
                  </span>
                </div>
              ) : (
                <Kpis stats={calculatedKpiData} />
              )}
            </div>

            <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-2">
              <div className="flex self-start flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-[#002A4B] px-5 py-3 text-white">
                  <h2 className="text-base font-semibold">Próximos Agendamentos</h2>
                  <span className="rounded-full bg-blue-900/60 px-3 py-1 text-sm font-semibold">
                    Total: {agendamentosDaSemana.length}
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {agendamentosDaSemana.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm italic text-gray-400">
                        Nenhum agendamento para esta semana.
                      </p>
                    </div>
                  ) : (
                    agendamentosDaSemana.map((ag) => (
                      <button
                        key={ag.idAgendamento}
                        type="button"
                        onClick={() => handleAgendamentoItemClick(ag.idAgendamento)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="min-w-[55px] rounded-lg border border-blue-100 bg-blue-50 p-2 text-center text-[#003d6b]">
                            <span className="block text-lg font-bold leading-none">
                              {formatDiaMesAgendamento(ag.dataAgendamento)}
                            </span>
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#1a2b3b] md:text-lg">
                              Servico: {ag.servicoNome || "Nao informado"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatHorarioAgendamento(
                                ag.inicioAgendamento,
                                ag.fimAgendamento,
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-400 transition-colors hover:text-blue-600">
                          <ExternalLink size={16} />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="flex self-start flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-[#002A4B] px-5 py-3 text-white">
                  <h2 className="text-base font-semibold">Itens em Estoque Crítico</h2>
                  <span className="rounded-full bg-blue-900/60 px-3 py-1 text-sm font-semibold">
                    Total: {itensCriticos.length}
                  </span>
                </div>

                <div className="divide-y divide-gray-50">
                  {itensCriticos.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm italic text-gray-400">Estoque em dia.</p>
                    </div>
                  ) : (
                    itensCriticos.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleEstoqueItemClick(item.id)}
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2.5 w-2.5 rounded-full ${
                              item.status === "Critico" ? "bg-red-500" : "bg-yellow-500"
                            }`}
                          />
                          <div>
                            <p className="text-base font-semibold text-[#1a2b3b] md:text-lg">
                              {item.nomeProduto}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`text-sm font-bold ${
                              item.status === "Critico" ? "text-red-600" : "text-orange-600"
                            }`}
                          >
                            {item.quantidadeTotal} {item.unidadeMedida || "un"}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                              item.status === "Critico"
                                ? "bg-red-50 text-red-600"
                                : "bg-orange-50 text-orange-600"
                            }`}
                          >
                            {item.status || "Baixo"}
                          </span>
                          <span className="text-gray-400">
                            <ExternalLink size={16} />
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
