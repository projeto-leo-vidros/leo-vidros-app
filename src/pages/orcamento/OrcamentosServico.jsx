import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Plus,
  Download,
  Pencil,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import { useOrcamentosPorPedido } from "../../hooks/queries/useOrcamentos";
import OrcamentosService from "../../api/services/orcamentosService";
import { OrcamentoStatusOptions } from "../../types/enums";
import { formatCurrency, formatDate } from "../../utils/formatters";

function getStatusConfig(statusNome) {
  return (
    OrcamentoStatusOptions.find(
      (o) => o.value === statusNome?.toUpperCase()
    ) ?? { label: statusNome ?? "—", color: "#64748b" }
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{
        color: cfg.color,
        borderColor: cfg.color + "55",
        backgroundColor: cfg.color + "18",
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function OrcamentosServico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const {
    data: orcamentos = [],
    isLoading,
    isError,
    refetch,
  } = useOrcamentosPorPedido(id);

  const handleDownload = async (orcamento) => {
    setDownloadingId(orcamento.id);
    setDownloadError(null);
    try {
      const result = await OrcamentosService.baixarPdf(
        orcamento.id,
        orcamento.numeroOrcamento
      );
      if (!result.success) {
        setDownloadError(
          result.error ?? "Não foi possível baixar o PDF. Tente novamente."
        );
        return;
      }
      const url = URL.createObjectURL(result.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${orcamento.numeroOrcamento ?? `orcamento-${orcamento.id}`}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex bg-[#f7f9fa] h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          toggleSidebar={() => setSidebarOpen((p) => !p)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto px-6 pt-20 pb-6 flex justify-center">
          <div className="w-full max-w-[1000px] flex flex-col gap-5">

            {/* Topbar */}
            <div className="relative py-5 min-h-[106px] flex items-center justify-center">
              <button
                onClick={() => navigate("/pedidos?tab=servico")}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer border border-gray-300 rounded-md px-4 py-2.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Serviço
              </button>

              <div className="text-center drop-shadow-sm flex flex-col items-center justify-center gap-2">
                <p className="text-xl font-bold text-gray-800 leading-tight flex items-center justify-center gap-3">
                  <span className="inline-flex items-center justify-center bg-[#e0f2fa] p-1.5 rounded-md shadow-sm">
                    <ClipboardList className="w-[18px] h-[18px] text-[#007EA7]" />
                  </span>
                  Orçamentos do Pedido #{String(id).padStart(3, "0")}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading
                    ? "Carregando..."
                    : `${orcamentos.length} orçamento${orcamentos.length !== 1 ? "s" : ""} encontrado${orcamentos.length !== 1 ? "s" : ""}`}
                </p>
              </div>

              <button
                onClick={() => navigate(`/Pedidos/${id}/orcamento`, { state: { fromApp: true } })}
                className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2.5 bg-[#007EA7] text-white rounded-md text-sm font-semibold shadow-sm hover:bg-[#006891] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Orçamento
              </button>
            </div>

            {/* Erro de download */}
            {downloadError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{downloadError}</p>
                <button
                  onClick={() => setDownloadError(null)}
                  className="ml-auto text-red-400 hover:text-red-600 text-xs cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Card principal */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#002A4B] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/80" />
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Lista de Orçamentos
                  </h3>
                  {!isLoading && (
                    <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {orcamentos.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => refetch()}
                  title="Atualizar lista"
                  className="h-8 w-8 flex items-center justify-center rounded-md border border-white/25 text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Loading */}
              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#007EA7] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Carregando orçamentos...</p>
                  </div>
                </div>
              )}

              {/* Erro de carregamento */}
              {isError && !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-gray-500">Não foi possível carregar os orçamentos.</p>
                  <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Tentar novamente
                  </button>
                </div>
              )}

              {/* Lista vazia */}
              {!isLoading && !isError && orcamentos.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600">Nenhum orçamento ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Crie o primeiro orçamento para este pedido</p>
                  </div>
                  <button
                    onClick={() => navigate(`/Pedidos/${id}/orcamento`, { state: { fromApp: true } })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#007EA7] text-white rounded-md text-sm font-semibold shadow-sm hover:bg-[#006891] transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Orçamento
                  </button>
                </div>
              )}

              {/* Itens */}
              {!isLoading && !isError && orcamentos.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {orcamentos.map((orc) => (
                    <OrcamentoCard
                      key={orc.id}
                      orcamento={orc}
                      onEdit={() =>
                        navigate(`/orcamentos/${orc.id}/editar`)
                      }
                      onDownload={() => handleDownload(orc)}
                      isDownloading={downloadingId === orc.id}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="h-4" />
          </div>
        </main>
      </div>
    </div>
  );
}

function OrcamentoCard({ orcamento, onEdit, onDownload, isDownloading }) {
  const temPdf = !!orcamento.pdfPath || orcamento.statusFila === "FINALIZADO";

  return (
    <div className="px-6 py-5 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Info principal */}
        <div className="flex items-start gap-4 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-[#e0f2fa] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#007EA7]" />
          </div>

          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-800">
                {orcamento.numeroOrcamento ?? `Orçamento #${orcamento.id}`}
              </span>
              <StatusBadge status={orcamento.statusNome} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {orcamento.dataOrcamento && (
                <span>Data: {formatDate(orcamento.dataOrcamento)}</span>
              )}
              {orcamento.clienteNome && (
                <span className="truncate max-w-[200px]">
                  Cliente: {orcamento.clienteNome}
                </span>
              )}
              {orcamento.formaPagamento && (
                <span>{orcamento.formaPagamento}</span>
              )}
            </div>

            {orcamento.observacoes && (
              <p className="text-xs text-gray-400 truncate max-w-[420px] mt-0.5">
                {orcamento.observacoes}
              </p>
            )}
          </div>
        </div>

        {/* Valor + ações */}
        <div className="flex items-center gap-3 shrink-0">
          {orcamento.valorTotal != null && (
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                Total
              </p>
              <p className="text-sm font-bold text-[#007EA7]">
                {formatCurrency(orcamento.valorTotal)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              title="Editar orçamento"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>

            <button
              onClick={onDownload}
              disabled={isDownloading || !temPdf}
              title={
                !temPdf
                  ? "PDF ainda não gerado. Edite o orçamento e gere o PDF primeiro."
                  : "Baixar PDF"
              }
              className="flex items-center gap-1.5 px-3 py-2 bg-[#007EA7] text-white rounded-md text-xs font-semibold hover:bg-[#006891] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
