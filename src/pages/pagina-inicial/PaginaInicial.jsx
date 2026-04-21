import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import {
  CircleDollarSign,
  Calendar,
  PackageSearch,
  FileText,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import Kpis from "../../components/kpis/Kpis";
import { useDashboardKpis } from "../../hooks/queries/useDashboard";

export default function PaginaInicial() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

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

  const handleEstoqueItemClick = (itemId) => navigate(`/estoque/${itemId}`);
  const handleAgendamentoItemClick = (agendamentoId) => navigate(`/agendamentos?id=${agendamentoId}`);

  const calculatedKpiData = useMemo(() => [
    {
      title: "Faturamento do mês",
      value: faturamentoMes ? `R$ ${faturamentoMes.toLocaleString('pt-BR')}` : "R$ 0",
      icon: CircleDollarSign,
      caption: `Maio 2026`, // Ajuste conforme a lógica de data do seu sistema
      trend: percentualFaturamento ? `${percentualFaturamento > 0 ? '+' : ''}${percentualFaturamento}%` : "",
      color: "blue"
    },
    {
      title: "Agendamentos de Hoje",
      value: qtdAgendamentosHoje || 0,
      icon: Calendar,
      caption: `${qtdAgendamentosFuturos || 0} agendamentos futuros`,
      color: "green"
    },
    {
      title: "Itens em Baixo Estoque",
      value: qtdItensCriticos || 0,
      icon: PackageSearch,
      caption: `${qtdItensCriticos || 0} itens requerem atenção`,
      color: "orange"
    },
    {
      title: "Orçamentos em Aberto",
      value: orcamentosAberto || 0,
      icon: FileText,
      caption: valorOrcamentosAberto ? `R$ ${valorOrcamentosAberto.toLocaleString('pt-BR')} em negociação` : "R$ 0 em negociação",
      color: "purple"
    }
  ], [faturamentoMes, percentualFaturamento, qtdAgendamentosHoje, qtdAgendamentosFuturos, qtdItensCriticos, orcamentosAberto, valorOrcamentosAberto]);

  return (
    <div className="flex min-h-screen font-[Inter] bg-[#f0f4f8]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <Header ref={headerRef} toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Container Centralizado */}
        <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-8 gap-6 mt-[60px] mx-auto w-full max-w-[1280px]">
          
          {/* Título e Subtítulo */}
          <div className="text-center w-full">
            <h1 className="text-2xl font-bold text-[#1a2b3b]">Painel de Controle</h1>
            <p className="text-gray-500 text-sm">Visualize todas as informações importantes em um só lugar</p>
          </div>

          {/* Banner de Alerta (Só aparece se houver itens críticos) */}
          {qtdItensCriticos > 0 && (
            <div className="w-full bg-[#fff9e6] border border-[#ffeeba] rounded-lg p-3 flex items-start gap-3 shadow-sm transition-all">
              <AlertTriangle className="text-[#856404] w-5 h-5 flex-shrink-0" />
              <p className="text-[#856404] text-sm">
                <strong>Atenção:</strong> {qtdItensCriticos} produtos precisam de reposição no estoque.
              </p>
            </div>
          )}

          {/* Grid de KPIs */}
          <div className="w-full">
            {loading ? (
              <div className="h-32 flex items-center justify-center bg-white rounded-xl border border-gray-100">
                <span className="text-gray-400 animate-pulse">Carregando indicadores...</span>
              </div>
            ) : (
              <Kpis stats={calculatedKpiData} />
            )}
          </div>

          {/* Cards de Detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            
            {/* Próximos Agendamentos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-[#0f2439] text-white px-5 py-3 flex justify-between items-center">
                <h2 className="font-semibold text-base">Próximos Agendamentos</h2>
                <span className="bg-blue-900/50 px-2 py-0.5 rounded text-xs">Total: {agendamentosFuturos.length}</span>
              </div>
              
              <div className="flex-1 divide-y divide-gray-50 min-h-[180px]">
                {agendamentosFuturos.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 text-sm italic">Nenhum agendamento futuro.</p>
                  </div>
                ) : (
                  agendamentosFuturos.map((ag) => (
                    <div key={ag.idAgendamento} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 text-[#003d6b] rounded-lg p-2 min-w-[55px] text-center border border-blue-100">
                          <span className="block text-lg font-bold leading-none">
                            {ag.inicioAgendamento?.split('/')[0] || '--'}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-blue-400">ABR</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#1a2b3b] text-sm">{ag.agendamentoObservacao || "Serviço"}</p>
                          <p className="text-xs text-gray-500">
                            {ag.clienteNome} • {ag.inicioAgendamento}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleAgendamentoItemClick(ag.idAgendamento)} className="text-gray-400 hover:text-blue-600">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Itens em Estoque Crítico */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="bg-[#0f2439] text-white px-5 py-3 flex justify-between items-center">
                <h2 className="font-semibold text-base">Itens em Estoque Crítico</h2>
                <span className="bg-blue-900/50 px-2 py-0.5 rounded text-xs">Total: {itensCriticos.length}</span>
              </div>

              <div className="flex-1 divide-y divide-gray-50 min-h-[180px]">
                {itensCriticos.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 text-sm italic">Estoque em dia.</p>
                  </div>
                ) : (
                  itensCriticos.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'Crítico' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="font-medium text-[#1a2b3b] text-sm">{item.nomeProduto}</p>
                          <p className="text-[10px] text-gray-400">Cód: {String(item.id)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold text-sm ${item.status === 'Crítico' ? 'text-red-600' : 'text-orange-600'}`}>
                          {item.quantidadeTotal} {item.unidadeMedida || 'un'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.status === 'Crítico' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {item.status || 'Baixo'}
                        </span>
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