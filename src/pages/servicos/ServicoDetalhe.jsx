import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wrench,
  X,
  Save,
  FileText,
  MapPin,
  ChevronDown,
} from "lucide-react";
import Header from "../../components/layout/Header/Header";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import SuccessModal from "../../components/overlay/Modal/SuccessModal";
import Api from "../../api/client/Api";
import PedidosService from "../../api/services/pedidosService";
import { formatCurrency, formatDate } from "../../utils/formatters";

const STEPS = [
  { label: "PENDENTE" },
  { label: "AGUARDANDO ORÇAMENTO" },
  { label: "ANÁLISE DO ORÇAMENTO" },
  { label: "ORÇAMENTO APROVADO" },
  { label: "SERVIÇO AGENDADO" },
  { label: "SERVIÇO EM EXECUÇÃO" },
  { label: "CONCLUÍDO" },
];

function getStepIndex(status) {
  if (!status) return 0;
  const s = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\u0300-\u036f]/g, "");

  if (s.includes("conclu") || s.includes("finaliz")) return 6;
  if (s.includes("execu") || s.includes("instal")) return 5;
  if (s.includes("agendad")) return 4;
  if (s.includes("aprovad")) return 3;
  if (s.includes("analise")) return 2;
  if (s.includes("orcamento") || s.includes("vistoria") || s.includes("aguardando")) return 1;
  return 0;
}

function Stepper({ status }) {
  const activeStep = getStepIndex(status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-600 mb-4">Progresso do Serviço</p>

      <div className="relative flex items-start justify-between">
        <div className="absolute h-[2px] bg-gray-200 z-0" style={{ top: "18px", left: "4%", right: "4%" }} />
        <div
          className="absolute h-[2px] bg-[#0099bf] z-0 transition-all duration-500"
          style={{ top: "18px", left: "4%", width: `${(activeStep / 6) * 92}%` }}
        />

        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;

          return (
            <div key={i} className="z-10 flex w-24 flex-col items-center text-center">
              <div
                className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-[#007EA7] border-[#007EA7] text-white"
                    : active
                    ? "bg-white border-[#56b9d2] text-[#007EA7] shadow-[0_0_0_5px_rgba(86,185,210,0.18)]"
                    : "bg-[#f8fafb] border-gray-200 text-gray-400"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              <span
                className={`mt-6 text-[10px] leading-[1.05rem] font-semibold uppercase ${
                  active ? "text-[#007EA7]" : done ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendamentoTabs({ agendamentos }) {
  const [activeTab, setActiveTab] = useState("orcamento");
  const [openItems, setOpenItems] = useState({});

  const orcamento = agendamentos.filter(
    (a) => a.tipoAgendamento?.toUpperCase().includes("ORC") || a.tipoAgendamento?.toUpperCase().includes("VISTORIA")
  );
  const servico = agendamentos.filter(
    (a) => !a.tipoAgendamento?.toUpperCase().includes("ORC") && !a.tipoAgendamento?.toUpperCase().includes("VISTORIA")
  );
  const current = activeTab === "orcamento" ? orcamento : servico;
  const toggle  = (i) => setOpenItems((p) => ({ ...p, [i]: !p[i] }));

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: "orcamento", label: "Orçamento",            count: orcamento.length },
          { id: "servico",   label: "Prestação de Serviço", count: servico.length  },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px shadow-sm ${
              activeTab === id
                ? "border-[#002A4B] text-[#002A4B]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === id
                  ? "bg-[#dce7f2] text-[#002A4B]"
                  : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="p-4 space-y-2">
        {current.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg shadow-sm">
            Nenhum agendamento
          </div>
        ) : (
          current.map((ag, i) => (
            <div key={ag.id || i} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {ag.tipoAgendamento || "Agendamento"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {ag.dataAgendamento ? formatDate(ag.dataAgendamento) : "Data não informada"}
                    {ag.horaAgendamento ? ` às ${ag.horaAgendamento}` : ""}
                  </p>
                  <span className="inline-block mt-1.5 text-[11px] font-semibold px-3 py-0.5 rounded-full border border-[#007EA7] text-[#007EA7] shadow-sm">
                    {ag.statusAgendamento?.nome || "Pendente"}
                  </span>
                </div>
                <div className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-400 shrink-0 shadow-sm">
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openItems[i] ? "rotate-180" : ""}`} />
                </div>
              </button>
              {openItems[i] && ag.observacao && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-2 text-xs text-gray-500">
                  {ag.observacao}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Forma de pagamento + Observações dentro do card de agendamento */}
      <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Forma de Pagamento</label>
          <slot name="formaPagamento" />
        </div>
      </div>
    </>
  );
}

export default function PedidoDetalhe() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [pedido,           setPedido]           = useState(null);
  const [rawPedido,        setRawPedido]         = useState(null);
  const [loading,          setLoading]           = useState(true);
  const [saving,           setSaving]            = useState(false);
  const [error,            setError]             = useState(null);
  const [sidebarOpen,      setSidebarOpen]       = useState(false);
  const [showSuccessModal, setShowSuccessModal]  = useState(false);

  const [formData, setFormData] = useState({
    clienteNome:    "",
    formaPagamento: "",
    observacoes:    "",
    produtos:       [],
  });

  const toggleSidebar = () => setSidebarOpen((p) => !p);

  useEffect(() => {
    const fetchPedido = async () => {
      setLoading(true);
      try {
        const response = await Api.get(`/pedidos/${id}`);
        if (response.status !== 200) throw new Error("Pedido não encontrado");
        const raw    = response.data;
        setRawPedido(raw);
        const mapped = PedidosService.mapearParaFrontend(raw);
        setPedido(mapped);
        setFormData({
          clienteNome:    mapped.clienteNome    || "",
          formaPagamento: mapped.formaPagamento || "",
          observacoes:    mapped.observacoes    || "",
          produtos:       mapped.produtos       || [],
        });
      } catch (err) {
        console.error("Erro ao buscar pedido:", err);
        alert("Erro ao carregar pedido");
        navigate("/Pedidos");
      } finally {
        setLoading(false);
      }
    };
    fetchPedido();
  }, [id, navigate]);

  const calcularValorTotal = () =>
    formData.produtos.reduce(
      (acc, p) => acc + (parseFloat(p.quantidade) || 0) * (parseFloat(p.preco) || 0),
      0
    );

  const handleFieldChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  const handleProdutoChange = (index, field, value) => {
    const updated = [...formData.produtos];
    updated[index] = {
      ...updated[index],
      [field]: field === "quantidade" || field === "preco" ? parseFloat(value) || 0 : value,
    };
    setFormData((p) => ({ ...p, produtos: updated }));
  };

  const handleAdicionarProduto = () =>
    setFormData((p) => ({
      ...p,
      produtos: [...p.produtos, { nome: "", quantidade: 1, preco: 0, estoqueId: 0, observacao: "" }],
    }));

  const handleRemoverProduto = (index) =>
    setFormData((p) => ({ ...p, produtos: p.produtos.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const valorTotal  = calcularValorTotal();
      const requestBody = {
        pedido: {
          valorTotal,
          ativo:          rawPedido?.ativo !== undefined ? rawPedido.ativo : true,
          formaPagamento: formData.formaPagamento,
          observacao:     formData.observacoes,
          cliente: {
            id:       pedido.clienteId || pedido.clienteInfo?.id || 0,
            nome:     formData.clienteNome,
            cpf:      pedido.clienteInfo?.cpf      || "",
            email:    pedido.clienteInfo?.email    || "",
            telefone: pedido.clienteInfo?.telefone || "",
            status:   "ATIVO",
            enderecos: pedido.clienteInfo?.endereco
              ? [{ id: pedido.clienteInfo.endereco.id || 0, rua: pedido.clienteInfo.endereco.rua || "", complemento: pedido.clienteInfo.endereco.complemento || "", cep: pedido.clienteInfo.endereco.cep || "", cidade: pedido.clienteInfo.endereco.cidade || "", bairro: pedido.clienteInfo.endereco.bairro || "", uf: pedido.clienteInfo.endereco.uf || "", pais: pedido.clienteInfo.endereco.pais || "Brasil", numero: pedido.clienteInfo.endereco.numero || 0 }]
              : [],
          },
          status: { tipo: pedido.statusOriginal?.tipo || "PEDIDO", nome: pedido.statusOriginal?.nome || "ATIVO" },
        },
        servico: null,
        produtos: formData.produtos.map((p) => ({
          estoqueId:              p.estoqueId || 0,
          quantidadeSolicitada:   parseFloat(p.quantidade) || 0,
          precoUnitarioNegociado: parseFloat(p.preco)      || 0,
          observacao:             p.observacao              || "",
        })),
      };

      await Api.put(`/pedidos/${id}`, requestBody);

      setPedido((prev) => ({
        ...prev,
        clienteNome:    formData.clienteNome,
        formaPagamento: formData.formaPagamento,
        observacoes:    formData.observacoes,
        produtos:       formData.produtos,
        valorTotal,
        itensCount:     formData.produtos.length,
      }));

      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading / not found ── */
  if (loading) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007EA7] mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex bg-[#f7f9fa] min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido não encontrado</p>
          <button
            onClick={() => navigate("/Pedidos")}
            className="bg-[#007EA7] text-white px-4 py-2 rounded-md hover:bg-[#006891] transition-colors"
          >
            Voltar para Pedidos
          </button>
        </div>
      </div>
    );
  }

  const valorTotal   = calcularValorTotal();
  const endereco     = pedido.clienteInfo?.endereco;
  const agendamentos = pedido.servico?.agendamentos || [];

  return (
    <div className="flex bg-[#f7f9fa] h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-y-auto px-6 pt-20 pb-6 flex justify-center">
          <div className="w-full max-w-[1400px] flex flex-col gap-4">

            {/* ── Topbar: único card unificado ── */}
            <div className="relative py-3 min-h-[86px] flex items-center justify-center">
              <button
                onClick={() => navigate("/Pedidos")}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium cursor-pointer border border-gray-300 rounded-md px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para Pedidos
              </button>

              <div className="flex items-center justify-center gap-3 drop-shadow-sm">
                <div className="bg-[#e0f2fa] p-2 rounded-md shadow-sm">
                  <Wrench className="w-5 h-5 text-[#007EA7]" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 leading-tight">
                    Pedido #{String(pedido.id).padStart(3, "0")}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDate(pedido.dataCompra)} · {pedido.clienteNome}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── Stepper ── */}
            <Stepper status={pedido.status} />

            {/* ── Grid principal: 1/3 + 2/3 ── */}
            <div className="grid grid-cols-3 gap-4">

              {/* ── Coluna esquerda (1/3) ── */}
              <div className="flex flex-col gap-4">

                {/* CLIENTE */}
                <SectionCard title="CLIENTE">
                  <div className="p-4 space-y-3">
                    <FieldGroup label="Nome">
                      <input
                        type="text"
                        value={formData.clienteNome}
                        onChange={(e) => handleFieldChange("clienteNome", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                      />
                    </FieldGroup>
                    {pedido.clienteInfo?.email && (
                      <FieldGroup label="E-mail">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                          {pedido.clienteInfo.email}
                        </div>
                      </FieldGroup>
                    )}
                    {pedido.clienteInfo?.telefone && (
                      <FieldGroup label="Telefone">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                          {pedido.clienteInfo.telefone}
                        </div>
                      </FieldGroup>
                    )}
                    {pedido.clienteInfo?.cpf && (
                      <FieldGroup label="CPF">
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                          {pedido.clienteInfo.cpf}
                        </div>
                      </FieldGroup>
                    )}
                  </div>
                </SectionCard>

                {/* ENDEREÇO */}
                <SectionCard title="ENDEREÇO">
                  <div className="p-4">
                    {endereco ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <FieldGroup label="Rua" className="col-span-2">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                              {endereco.rua || "—"}
                            </div>
                          </FieldGroup>
                          <FieldGroup label="Nº">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 text-center shadow-sm">
                              {endereco.numero || "s/n"}
                            </div>
                          </FieldGroup>
                        </div>
                        <FieldGroup label="Bairro">
                          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                            {endereco.bairro || "—"}
                          </div>
                        </FieldGroup>
                        <div className="grid grid-cols-2 gap-2">
                          <FieldGroup label="Cidade">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate shadow-sm">
                              {endereco.cidade || "—"}
                            </div>
                          </FieldGroup>
                          <FieldGroup label="CEP">
                            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm">
                              {endereco.cep || "—"}
                            </div>
                          </FieldGroup>
                        </div>
                        <button
                          onClick={() => navigate("/geo-localizacao")}
                          className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm"
                        >
                          <MapPin className="w-4 h-4" />
                          Ver no Mapa
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8 text-sm text-gray-400 border border-dashed border-gray-200 rounded-md shadow-sm">
                        Endereço não informado
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* ── Coluna direita (2/3) ── */}
              <div className="col-span-2 flex flex-col gap-4">

                {/* INSTALAÇÃO */}
                <SectionCard
                  title="INSTALAÇÃO"
                  badge={`#${String(formData.produtos.length).padStart(2, "0")} DE ${String(formData.produtos.length).padStart(2, "0")}`}
                  action={
                    <button
                      onClick={handleAdicionarProduto}
                      className="text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  }
                >
                  <div className="p-4">
                    {formData.produtos.length === 0 ? (
                      <div className="flex items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm shadow-sm">
                        Nenhum produto adicionado
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {formData.produtos.map((produto, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative shadow-sm">
                            <button
                              onClick={() => handleRemoverProduto(index)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer shadow-sm"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-xs font-bold text-[#007EA7] mb-2 uppercase tracking-wide">
                              Item #{String(index + 1).padStart(2, "0")} de {String(formData.produtos.length).padStart(2, "0")}
                            </p>
                            <div className="space-y-2">
                              <FieldGroup label="Produto">
                                <input
                                  type="text"
                                  value={produto.nome}
                                  onChange={(e) => handleProdutoChange(index, "nome", e.target.value)}
                                  placeholder="Nome do produto"
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                />
                              </FieldGroup>
                              <div className="grid grid-cols-2 gap-2">
                                <FieldGroup label="Qtd">
                                  <input
                                    type="number"
                                    min="1"
                                    value={produto.quantidade}
                                    onChange={(e) => handleProdutoChange(index, "quantidade", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                  />
                                </FieldGroup>
                                <FieldGroup label="Preço Unit.">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={produto.preco}
                                    onChange={(e) => handleProdutoChange(index, "preco", e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] outline-none shadow-sm"
                                  />
                                </FieldGroup>
                              </div>
                              <p className="text-xs text-[#007EA7] font-bold text-right pt-1 border-t border-gray-200">
                                Subtotal: {formatCurrency((parseFloat(produto.quantidade) || 0) * (parseFloat(produto.preco) || 0))}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {formData.produtos.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                        <p className="text-sm font-bold text-gray-800">
                          Total: <span className="text-[#007EA7]">{formatCurrency(valorTotal)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* AGENDAMENTO — largura total da coluna direita */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#002A4B] px-4 py-2.5 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">Agendamento</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/70">
                        {formatDate(pedido.dataCompra)} · {pedido.status}
                      </span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <AgendamentoTabs agendamentos={agendamentos} />

                  {/* Forma de pagamento + Observações integradas */}
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-3 border-t border-gray-100">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Forma de Pagamento</label>
                      <select
                        value={formData.formaPagamento}
                        onChange={(e) => handleFieldChange("formaPagamento", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 cursor-pointer focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] bg-white outline-none shadow-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="PIX">PIX</option>
                        <option value="Cartão de crédito">Cartão de crédito</option>
                        <option value="Cartão de débito">Cartão de débito</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Transferência">Transferência bancária</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Observações</label>
                      <textarea
                        rows={2}
                        value={formData.observacoes}
                        onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                        placeholder="Observações sobre o pedido..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#007EA7] focus:border-[#007EA7] resize-none outline-none shadow-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Botões de ação ── */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => navigate(`/Pedidos/${id}/orcamento`)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Gerar Orçamento
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#007EA7] text-white rounded-lg hover:bg-[#006891] transition-colors disabled:opacity-50 text-sm font-semibold shadow-md cursor-pointer"
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
        </main>
      </div>

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message="Pedido atualizado com sucesso!"
      />
    </div>
  );
}

function SectionCard({ title, badge, action, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-[#002A4B] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
          {badge && (
            <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {action && action}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}