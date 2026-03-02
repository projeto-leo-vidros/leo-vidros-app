import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  Save,
  Calendar,
  ClipboardList,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Hash,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import SuccessModal from "../../components/overlay/Modal/SuccessModal";
import EditarAgendamentoModal from "../pedidos/components/EditarAgendamentoModal";
import Api from "../../api/client/Api";
import PedidosService from "../../api/services/pedidosService";
import { formatDate } from "../../utils/formatters";

const ETAPAS_SERVICO = [
  { valor: "PENDENTE", label: "Pendente", progresso: 1 },
  { valor: "AGUARDANDO ORÇAMENTO", label: "Aguardando Orçamento", progresso: 2 },
  { valor: "ANÁLISE DO ORÇAMENTO", label: "Análise do Orçamento", progresso: 3 },
  { valor: "ORÇAMENTO APROVADO", label: "Orçamento Aprovado", progresso: 4 },
  { valor: "SERVIÇO AGENDADO", label: "Serviço Agendado", progresso: 5 },
  { valor: "SERVIÇO EM EXECUÇÃO", label: "Serviço em Execução", progresso: 6 },
  { valor: "CONCLUÍDO", label: "Concluído", progresso: 7 },
];

const limparTextoParaComparacao = (texto) => {
  if (!texto) return "";
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ /g, "_");
};

const encontrarEtapaCorrespondente = (etapaDoBackend) => {
  if (!etapaDoBackend) return "PENDENTE";
  const backendLimpo = limparTextoParaComparacao(etapaDoBackend);
  const etapaEncontrada = ETAPAS_SERVICO.find(
    (e) => limparTextoParaComparacao(e.valor) === backendLimpo,
  );
  return etapaEncontrada ? etapaEncontrada.valor : etapaDoBackend || "PENDENTE";
};

/* ── Status badge config ── */
const STATUS_CONFIG = {
  Ativo:        { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500",   label: "Ativo" },
  Finalizado:   { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500",  label: "Finalizado" },
  "Em Andamento":{ bg: "bg-amber-50", text: "text-amber-700",  dot: "bg-amber-500",  label: "Em Andamento" },
  Cancelado:    { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500",    label: "Cancelado" },
};

export default function ServicoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [servico, setServico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [etapaAnterior, setEtapaAnterior] = useState("");
  const [mostrarModalExcluirAgendamentos, setMostrarModalExcluirAgendamentos] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [mostrarEditarAgendamento, setMostrarEditarAgendamento] = useState(false);

  const [formData, setFormData] = useState({
    servicoNome: "",
    servicoCodigo: "",
    precoBase: 0,
    descricao: "",
    etapa: "PENDENTE",
    progressoValor: 1,
    progressoTotal: 7,
    valorTotal: 0,
    formaPagamento: "",
    status: "Ativo",
  });

  const toggleSidebar = () => setSidebarOpen((p) => !p);

  const fetchServico = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Api.get(`/pedidos/${id}`);
      if (response.status !== 200) throw new Error("Serviço não encontrado");
      const mapped = PedidosService.mapearParaFrontend(response.data);
      const rawEtapa = mapped.etapaOriginal || mapped.etapa || "PENDENTE";
      const etapaCalc = encontrarEtapaCorrespondente(rawEtapa);
      const etapaInfo = ETAPAS_SERVICO.find((e) => e.valor === etapaCalc);

      setServico(mapped);
      setEtapaAnterior(etapaCalc);
      setFormData({
        servicoNome: mapped.servico?.nome || mapped.servicoNome || "",
        servicoCodigo: mapped.servico?.codigo || "",
        precoBase: mapped.servico?.precoBase || 0,
        descricao: mapped.descricao || "",
        etapa: etapaCalc,
        progressoValor: etapaInfo ? etapaInfo.progresso : mapped.progresso?.[0] || 1,
        progressoTotal: 7,
        valorTotal: mapped.valorTotal || 0,
        formaPagamento: mapped.formaPagamento || "",
        status: mapped.status || "Ativo",
      });
    } catch (err) {
      console.error("Erro ao buscar serviço:", err);
      alert("Erro ao carregar serviço");
      navigate("/Servicos");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchServico(); }, [fetchServico]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "etapa") {
      const etapaInfo = ETAPAS_SERVICO.find((e) => e.valor === value);
      setFormData((prev) => ({
        ...prev,
        etapa: value,
        progressoValor: etapaInfo ? etapaInfo.progresso : prev.progressoValor,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    const voltouParaPendente = etapaAnterior !== "PENDENTE" && formData.etapa === "PENDENTE";
    if (voltouParaPendente && servico?.servico?.agendamentos?.length > 0) {
      setMostrarModalExcluirAgendamentos(true);
      return;
    }
    await salvarAlteracoes();
  };

  const salvarAlteracoes = async () => {
    setSaving(true);
    setError(null);
    try {
      const voltouParaPendente = etapaAnterior !== "PENDENTE" && formData.etapa === "PENDENTE";
      if (voltouParaPendente && servico?.servico?.agendamentos?.length > 0) {
        await Promise.all(servico.servico.agendamentos.map((ag) => Api.delete(`/agendamentos/${ag.id}`)));
      }

      const pedidoData = {
        pedido: {
          valorTotal: parseFloat(formData.valorTotal) || 0.0,
          ativo: formData.status === "Ativo",
          formaPagamento: formData.formaPagamento || "A negociar",
          observacao: formData.descricao || "",
          cliente: {
            id: servico.clienteId || servico.clienteInfo?.id,
            nome: servico.clienteNome || servico.clienteInfo?.nome || "",
            cpf: servico.clienteInfo?.cpf || "",
            email: servico.clienteInfo?.email || "",
            telefone: servico.clienteInfo?.telefone || "",
            status: "Ativo",
            enderecos: servico.clienteInfo?.endereco
              ? [{ id: servico.clienteInfo.endereco.id || 0, rua: servico.clienteInfo.endereco.rua || "", complemento: servico.clienteInfo.endereco.complemento || "", cep: servico.clienteInfo.endereco.cep || "", cidade: servico.clienteInfo.endereco.cidade || "", bairro: servico.clienteInfo.endereco.bairro || "", uf: servico.clienteInfo.endereco.uf || "", pais: servico.clienteInfo.endereco.pais || "Brasil", numero: servico.clienteInfo.endereco.numero || 0 }]
              : [],
          },
          status: { tipo: "PEDIDO", nome: formData.status.toUpperCase() },
        },
        servico: {
          id: servico.servico?.id,
          nome: formData.servicoNome || servico.servico?.nome || "Serviço",
          codigo: formData.servicoCodigo || servico.servico?.codigo || "",
          descricao: formData.descricao || "",
          precoBase: parseFloat(formData.precoBase) || 0.0,
          ativo: true,
          etapa: { tipo: "PEDIDO", nome: formData.etapa },
        },
      };

      const response = await Api.put(`/pedidos/${id}`, pedidoData);
      if (response.status === 200 || response.status === 204) {
        setEtapaAnterior(formData.etapa);
        setMostrarModalExcluirAgendamentos(false);
        await fetchServico();
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2500);
      } else {
        setError("Erro ao atualizar serviço");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAgendarOrcamento = () => navigate("/Agendamentos", { state: { tipo: "orcamento", servicoId: id, clienteNome: servico?.clienteNome, servicoNome: formData.servicoNome } });
  const handleAgendarServico = () => navigate("/Agendamentos", { state: { tipo: "servico", servicoId: id, clienteNome: servico?.clienteNome, servicoNome: formData.servicoNome } });

  const handleEditarAgendamento = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setMostrarEditarAgendamento(true);
  };

  const handleAgendamentoEditadoSuccess = async () => {
    try {
      const result = await PedidosService.buscarPorId(id);
      if (!result.success) return;
      const servicoAtualizado = PedidosService.mapearParaFrontend(result.data);
      const rawEtapa = servicoAtualizado.etapaOriginal || servicoAtualizado.etapa || "PENDENTE";
      const etapaCalc = encontrarEtapaCorrespondente(rawEtapa);
      if (etapaCalc !== etapaAnterior) {
        const pedidoData = { pedido: { valorTotal: servicoAtualizado.valorTotal || 0.0, ativo: servicoAtualizado.status === "Ativo", formaPagamento: servicoAtualizado.formaPagamento || "A negociar", observacao: servicoAtualizado.descricao || "", cliente: { id: servicoAtualizado.clienteId || servicoAtualizado.clienteInfo?.id, nome: servicoAtualizado.clienteNome || "", cpf: servicoAtualizado.clienteInfo?.cpf || "", email: servicoAtualizado.clienteInfo?.email || "", telefone: servicoAtualizado.clienteInfo?.telefone || "", status: "Ativo", enderecos: servicoAtualizado.clienteInfo?.endereco ? [{ ...servicoAtualizado.clienteInfo.endereco, pais: servicoAtualizado.clienteInfo.endereco.pais || "Brasil" }] : [] }, status: { tipo: "PEDIDO", nome: servicoAtualizado.status.toUpperCase() } }, servico: { id: servico.servico?.id, nome: servicoAtualizado.servicoNome || servicoAtualizado.servico?.nome || "Serviço", descricao: servicoAtualizado.descricao || "", precoBase: servicoAtualizado.servico?.precoBase || 0.0, ativo: true, etapa: { tipo: "PEDIDO", nome: etapaCalc } } };
        await Api.put(`/pedidos/${id}`, pedidoData);
      }
      await fetchServico();
      setMostrarEditarAgendamento(false);
      setAgendamentoSelecionado(null);
    } catch {
      setError("Erro ao atualizar informações. Recarregue a página.");
    }
  };

  const mostrarBotaoAgendarOrcamento = formData.etapa?.toUpperCase() === "PENDENTE";
  const mostrarBotaoAgendarServico = formData.etapa?.toUpperCase() === "ORÇAMENTO APROVADO";

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex bg-[#f0f4f7] min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-[#007EA7]/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#007EA7] animate-spin" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Carregando serviço...</p>
        </div>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="flex bg-[#f0f4f7] min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Serviço não encontrado</p>
          <button onClick={() => navigate("/Pedidos")} className="bg-[#007EA7] text-white px-4 py-2 rounded-md hover:bg-[#006891] transition-colors">Voltar</button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[servico.status] || STATUS_CONFIG["Ativo"];
  const etapaLabel = ETAPAS_SERVICO.find((e) => e.valor === formData.etapa)?.label || formData.etapa;
  const agendamentos = servico?.servico?.agendamentos || [];

  return (
    <div className="flex bg-[#f0f4f7] min-h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <div className="pt-20 lg:pt-20" />

        <main className="flex-1 flex flex-col items-center px-4 md:px-6 lg:px-8 pt-5 pb-12">
          <div className="max-w-7xl w-full">

            {/* ── Top bar ── */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => navigate("/Pedidos")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium group"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm group-hover:border-[#007EA7] group-hover:text-[#007EA7] transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </span>
                Voltar para Serviços
              </button>
            </div>

            {/* ── Single-column layout ── */}
            <div className="flex flex-col gap-5">

                {/* ── Page header ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#007EA7]/10 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-[#007EA7]" />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {formData.servicoNome || "Serviço"}
                    </h1>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                      <Hash className="w-3 h-3" />
                      {String(servico.id).padStart(3, "0")}
                    </span>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Cliente: <span className="text-gray-600 font-medium">{servico.clienteNome}</span>
                    &nbsp;·&nbsp;
                    {formatDate(servico.dataCompra)}
                  </p>
                </div>
              </div>

              {/* Progress stepper */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                {/* Label da etapa atual */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400 font-medium">Progresso do Serviço</span>
                  <span className="text-xs font-semibold text-[#007EA7] bg-[#007EA7]/8 px-2.5 py-1 rounded-full">
                    {etapaLabel} · {formData.progressoValor}/7
                  </span>
                </div>

                {/* Steps */}
                <div className="relative flex items-start justify-between">
                  {/* Track background */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 z-0" />
                  {/* Track progress */}
                  <div
                    className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-[#007EA7] to-[#00b4d8] z-0 transition-all duration-700 ease-in-out"
                    style={{ width: `${((formData.progressoValor - 1) / 6) * 100}%` }}
                  />

                  {ETAPAS_SERVICO.map((etapa) => {
                    const done = etapa.progresso < formData.progressoValor;
                    const active = etapa.progresso === formData.progressoValor;
                    return (
                      <div key={etapa.valor} className="flex flex-col items-center gap-2 z-10 flex-1">
                        {/* Circle */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          done
                            ? "bg-[#007EA7] shadow-sm shadow-[#007EA7]/30"
                            : active
                            ? "bg-white border-2 border-[#007EA7] shadow-md shadow-[#007EA7]/25 ring-4 ring-[#007EA7]/10 scale-110"
                            : "bg-white border-2 border-gray-200"
                        }`}>
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : active ? (
                            <span className="text-sm font-bold text-[#007EA7]">{etapa.progresso}</span>
                          ) : (
                            <span className="text-xs font-semibold text-gray-300">{etapa.progresso}</span>
                          )}
                        </div>
                        {/* Label */}
                        <span className={`text-[9px] font-semibold text-center leading-snug max-w-[58px] uppercase tracking-wide transition-colors ${
                          active ? "text-[#007EA7]" : done ? "text-gray-400" : "text-gray-300"
                        }`}>
                          {etapa.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* 1. Cliente Card */}
                {(servico.clienteInfo || servico.clienteNome) && (
                  <SectionCard
                    title="Cliente"
                    icon={<User className="w-4 h-4 text-emerald-600" />}
                    iconBg="bg-emerald-100"
                  >
                    {/* Name */}
                    <div className="flex flex-col items-center justify-center text-center mb-6">
                      <p className="font-semibold text-gray-900 text-sm">{servico.clienteNome || "—"}</p>
                      {servico.clienteInfo?.cpf && (
                        <p className="text-xs text-gray-400">CPF: {servico.clienteInfo.cpf}</p>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {servico.clienteInfo?.email && (
                        <ClientInfoRow
                          icon={<Mail className="w-4 h-4 text-[#007EA7]" />}
                          label="E-mail"
                          value={servico.clienteInfo.email}
                        />
                      )}
                      {servico.clienteInfo?.telefone && (
                        <ClientInfoRow
                          icon={<Phone className="w-4 h-4 text-[#007EA7]" />}
                          label="Telefone"
                          value={servico.clienteInfo.telefone}
                        />
                      )}
                      {servico.clienteInfo?.endereco && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center gap-2">
                          <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-[#007EA7]" />
                          </div>
                          <div className="w-full">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Endereço</p>
                            <p className="text-sm text-gray-800 font-medium">
                              {servico.clienteInfo.endereco.rua}, {servico.clienteInfo.endereco.numero || "S/N"}
                            </p>
                            {servico.clienteInfo.endereco.complemento && (
                              <p className="text-xs text-gray-500">{servico.clienteInfo.endereco.complemento}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5">
                              {servico.clienteInfo.endereco.bairro} — {servico.clienteInfo.endereco.cidade}/{servico.clienteInfo.endereco.uf}
                            </p>
                            {servico.clienteInfo.endereco.cep && (
                              <p className="text-xs text-gray-400">CEP: {servico.clienteInfo.endereco.cep}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* 2. Service Info Card */}
                <SectionCard title="Informações do Serviço" icon={<Wrench className="w-4 h-4 text-[#007EA7]" />} iconBg="bg-[#007EA7]/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Nome do Serviço">
                      <input
                        type="text"
                        name="servicoNome"
                        value={formData.servicoNome}
                        onChange={handleChange}
                        placeholder="Nome do serviço"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none"
                      />
                    </FormField>

                    <FormField label="Código">
                      <input
                        type="text"
                        value={formData.servicoCodigo || "—"}
                        readOnly
                        className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm text-center bg-gray-50 text-gray-400 cursor-not-allowed"
                      />
                    </FormField>

                    <FormField label="Preço Base">
                      <input
                        type="number"
                        step="0.01"
                        name="precoBase"
                        value={formData.precoBase}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none"
                      />
                    </FormField>

                    <FormField label="Valor Total">
                      <input
                        type="number"
                        step="0.01"
                        name="valorTotal"
                        value={formData.valorTotal}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none"
                      />
                    </FormField>

                    <FormField label="Forma de Pagamento">
                      <select
                        name="formaPagamento"
                        value={formData.formaPagamento}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none bg-white cursor-pointer"
                      >
                        <option value="">A negociar</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Cartão de débito">Cartão de débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Transferência">Transferência bancária</option>
                      </select>
                    </FormField>

                    <FormField label="Etapa Atual">
                      <select
                        name="etapa"
                        value={formData.etapa}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none bg-white cursor-pointer"
                      >
                        {ETAPAS_SERVICO.map((etapa) => (
                          <option key={etapa.valor} value={etapa.valor}>{etapa.label}</option>
                        ))}
                      </select>
                    </FormField>

                    <div className="sm:col-span-2">
                      <FormField label="Descrição">
                        <textarea
                          name="descricao"
                          rows={3}
                          value={formData.descricao}
                          onChange={handleChange}
                          placeholder="Descreva detalhes do serviço..."
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#007EA7]/30 focus:border-[#007EA7] transition-all outline-none resize-none"
                        />
                      </FormField>
                    </div>
                  </div>

                  {/* Schedule action buttons */}
                  {(mostrarBotaoAgendarOrcamento || mostrarBotaoAgendarServico) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3 flex-wrap">
                      {mostrarBotaoAgendarOrcamento && (
                        <button
                          onClick={handleAgendarOrcamento}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                        >
                          <ClipboardList className="w-4 h-4" />
                          Agendar Orçamento
                        </button>
                      )}
                      {mostrarBotaoAgendarServico && (
                        <button
                          onClick={handleAgendarServico}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm"
                        >
                          <Calendar className="w-4 h-4" />
                          Agendar Serviço
                        </button>
                      )}
                    </div>
                  )}
                </SectionCard>

                {/* 3. Appointments Card */}
                <SectionCard
                  title="Agendamentos"
                  icon={<Calendar className="w-4 h-4 text-orange-600" />}
                  iconBg="bg-orange-100"
                  badge={agendamentos.length}
                >
                  {agendamentos.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium text-sm">Nenhum agendamento</p>
                      <p className="text-gray-400 text-xs">Os agendamentos aparecerão aqui quando criados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agendamentos.map((agendamento) => (
                        <AppointmentCard
                          key={agendamento.id}
                          agendamento={agendamento}
                          onEdit={handleEditarAgendamento}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* Save + Gerar Orçamento buttons */}
                <div className="pb-2 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(`/Pedidos/${id}/orcamento`)}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-[#007EA7] hover:text-[#007EA7] transition-all text-sm font-semibold shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar Orçamento
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#007EA7] text-white rounded-xl hover:bg-[#006891] active:scale-95 transition-all disabled:opacity-50 font-semibold text-sm shadow-md shadow-[#007EA7]/20"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── Modal: Confirmar exclusão de agendamentos ── */}
      {mostrarModalExcluirAgendamentos && (
        <div
          className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setMostrarModalExcluirAgendamentos(false); }}
        >
          <div className="flex flex-col gap-4 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Excluir Todos os Agendamentos?</h2>
              <div className="text-slate-600 space-y-2 w-full">
                <p className="text-sm">
                  Ao voltar para <span className="font-bold text-amber-600">PENDENTE</span>, todos os agendamentos serão{" "}
                  <span className="font-bold text-red-600">excluídos permanentemente</span>.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mt-3">
                  <p className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">Agendamentos afetados</p>
                  <ul className="space-y-1.5">
                    {agendamentos.map((ag) => (
                      <li key={ag.id} className="flex items-center gap-2 text-sm text-amber-800">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                        <span className="font-mono font-medium">#AG{ag.id.toString().padStart(3, "0")}</span>
                        <span className="text-amber-600">·</span>
                        <span>{ag.tipoAgendamento === "ORCAMENTO" ? "📊 Orçamento" : "🔧 Execução"}</span>
                        <span className="text-amber-600">·</span>
                        <span>{ag.dataAgendamento}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-red-500 font-semibold mt-2">⚠️ Esta ação não pode ser desfeita!</p>
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setMostrarModalExcluirAgendamentos(false)}
                disabled={saving}
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={salvarAlteracoes}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-red-600/20"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : "Sim, Excluir Todos"}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditarAgendamentoModal
        isOpen={mostrarEditarAgendamento}
        onClose={() => { setMostrarEditarAgendamento(false); setAgendamentoSelecionado(null); }}
        agendamento={agendamentoSelecionado}
        onSuccess={handleAgendamentoEditadoSuccess}
      />

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message="Serviço atualizado com sucesso!"
      />
    </div>
  );
}

/* ── Sub-components ── */

function SectionCard({ title, icon, iconBg, badge, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-center gap-3 px-5 py-4 border-b border-gray-100 relative">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <h2 className="font-semibold text-gray-800 text-base text-center">{title}</h2>
        {badge !== undefined && (
          <span className="absolute right-5 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">{badge}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function ClientInfoRow({ icon, label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center gap-2">
      <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 w-full">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

function AppointmentCard({ agendamento, onEdit }) {
  const isOrcamento = agendamento.tipoAgendamento === "ORCAMENTO";
  const statusNome = agendamento.statusAgendamento?.nome;
  const statusStyle =
    statusNome === "PENDENTE"     ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    statusNome === "EM ANDAMENTO" ? "bg-blue-100 text-blue-700 border-blue-200" :
    statusNome === "CONCLUÍDO"    ? "bg-green-100 text-green-700 border-green-200" :
                                    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-[#007EA7]/30 hover:shadow-md transition-all bg-white">
      <div className="flex items-center justify-center gap-2 flex-wrap mb-4 relative">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${isOrcamento ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
            {isOrcamento ? "📊 Orçamento" : "🔧 Execução"}
          </span>
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${statusStyle}`}>
            {statusNome || "N/A"}
          </span>
          <span className="text-xs font-mono text-gray-400">#AG{agendamento.id.toString().padStart(3, "0")}</span>
        </div>
        <button
          onClick={() => onEdit(agendamento)}
          className="absolute right-0 p-1.5 text-gray-400 hover:text-[#007EA7] hover:bg-blue-50 rounded-lg transition-colors"
          title="Editar agendamento"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Data</span>
          <div className="flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">{agendamento.dataAgendamento}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Horário</span>
          <div className="flex items-center gap-2 justify-center">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-700">
              {agendamento.inicioAgendamento} — {agendamento.fimAgendamento}
            </span>
          </div>
        </div>
      </div>

      {agendamento.endereco && (
        <div className="flex flex-col items-center gap-1 border border-gray-100 rounded-xl p-3 mb-2 bg-gray-50 text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <p className="text-xs font-medium text-gray-700">
              {agendamento.endereco.rua}, {agendamento.endereco.numero || "S/N"}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {agendamento.endereco.bairro}, {agendamento.endereco.cidade} — {agendamento.endereco.uf}
          </p>
        </div>
      )}

      {agendamento.observacao && (
        <div className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 line-clamp-2">{agendamento.observacao}</p>
        </div>
      )}
    </div>
  );
}