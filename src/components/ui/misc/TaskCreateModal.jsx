import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Trash2,
  CheckCircle,
  Calendar,
  Package,
  MapPin,
  ClipboardList,
} from "lucide-react";
import Api from "../../../api/client/Api";
import { cepMask } from "../../../utils/masks";
import { modalClasses } from "../../../components/ui/modal/modalStyles";
import UniversalInput from "../Input/UniversalInput";
import Button from "../Button/Button.component";

const getInitials = (label) => {
  if (!label || typeof label !== "string") return "";
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};
const MultipleSelectCheckmarks = ({
  options,
  value = [],
  onChange,
  placeholder,
  className,
}) => {
  const toggleOption = (optionId) => {
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId];
    onChange(newValue);
  };

  return (
    <div
      className={`max-h-32 w-full overflow-y-auto rounded-md border border-gray-300 bg-white p-2 shadow-sm ${className}`}
    >
      {options.length === 0 ? (
        <span className="block p-1 text-sm text-gray-400 italic">
          {placeholder || "Sem opções"}
        </span>
      ) : (
        options.map((opt) => (
          <div
            key={opt.value}
            className="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-gray-50"
            onClick={() => toggleOption(opt.value)}
          >
            <div
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${value.includes(opt.value) ? "border-blue-600 bg-blue-600" : "border-gray-800 group-hover:border-blue-400"}`}
            >
              {value.includes(opt.value) && (
                <Check size={12} className="text-white" />
              )}
            </div>

            <div className="flex items-center gap-2.5 overflow-hidden py-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#134074ff] text-xs font-bold tracking-wider text-white uppercase shadow-sm">
                {getInitials(opt.label)}
              </div>
              <span
                className={`truncate text-sm ${value.includes(opt.value) ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
              >
                {opt.label}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const categoryOptions = [
  { value: "SERVICO", label: "Prestação de serviço", color: "#3B82F6" },
  { value: "ORCAMENTO", label: "Orçamento", color: "#FBBF24" },
];

const normalizePedidoProdutos = (pedidoData) => {
  const produtos = pedidoData?.produtos || [];

  return produtos
    .filter((produto) => produto?.produtoId != null)
    .map((produto) => ({
      id: produto.produtoId,
      nome: produto.nomeProduto || produto.nome || "Produto",
      quantidade: parseFloat(produto.quantidadeSolicitada) || 1,
      origemPedido: true,
    }));
};

const mergeProdutosPedidoComSelecionados = (
  produtosPedido = [],
  produtosSelecionados = [],
) => {
  const extras = (produtosSelecionados || []).filter((produto) => {
    if (!produto) return false;
    if (produto.origemPedido === false) return true;

    return !produtosPedido.some(
      (produtoPedido) => String(produtoPedido.id) === String(produto.id),
    );
  });

  return [...produtosPedido, ...extras];
};

const getProdutosIniciais = (initialData = {}) => {
  const produtosPedido = normalizePedidoProdutos(initialData?.pedido?.originalData);

  if ((initialData?.produtos || []).length === 0) {
    return produtosPedido;
  }

  const produtosInformados = initialData.produtos.map((produto) => ({
    ...produto,
    origemPedido: produto?.origemPedido ?? false,
  }));

  return mergeProdutosPedidoComSelecionados(produtosPedido, produtosInformados);
};

const TaskCreateModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    id: null,
    tipoAgendamento: "",
    pedido: null,
    funcionarios: [],
    produtos: [],
    eventDate: "",
    startTime: "",
    endTime: "",
    rua: "",
    numero: "",
    cep: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    pais: "",
    observacao: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const [funcionariosOptions, setFuncionariosOptions] = useState([]);
  const [pedidoOptions, setPedidoOptions] = useState([]);
  const [produtosOptions, setProdutosOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedFuncionarios, setSelectedFuncionarios] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);

  const fetchFuncionariosDisponiveis = useCallback(
    async (data, inicio, fim) => {
      if (!data || !inicio || !fim) {
        setFuncionariosOptions([]);
        return;
      }
      setLoadingFuncionarios(true);
      try {
        const fmtTime = (t) => {
          if (!t) return "00:00:00";
          const parts = t.split(":");
          return `${(parts[0] || "00").padStart(2, "0")}:${(parts[1] || "00").padStart(2, "0")}:00`;
        };
        const response = await Api.get("/funcionarios/disponiveis", {
          params: { data, inicio: fmtTime(inicio), fim: fmtTime(fim) },
        });
        const disponiveis = response.data || [];
        setFuncionariosOptions(
          disponiveis.map((func) => ({ value: func.id, label: func.nome })),
        );
      } catch (error) {
        console.error("Erro ao buscar funcionários disponíveis:", error);
        try {
          const response = await Api.get("/funcionarios");
          setFuncionariosOptions(
            response.data.map((func) => ({ value: func.id, label: func.nome })),
          );
        } catch (fallbackError) {
          setFuncionariosOptions([]);
        }
      } finally {
        setLoadingFuncionarios(false);
      }
    },
    [],
  );

  const fetchOpcoesPedido = useCallback(
    async (tipoValue) => {
      if (!tipoValue) {
        setPedidoOptions([]);
        return;
      }
      setLoadingOptions(true);

      try {
        let allOrders = [];

        try {
          const responseServicos = await Api.get("/pedidos/servicos");
          const raw = responseServicos.data;
          allOrders = raw?.content ?? (Array.isArray(raw) ? raw : []);
        } catch (error) {
          console.warn(
            "⚠️ Endpoint /Pedidos/servicos não disponível, tentando alternativa...",
          );

          try {
            const responseAll = await Api.get("/pedidos");
            const todosPedidos = responseAll.data || [];
            allOrders = todosPedidos.filter(
              (p) => p.tipoPedido === "serviço" || p.servico,
            );
          } catch (error2) {
            console.error("❌ Erro ao buscar pedidos:", error2);
          }
        }
        const availableOrders = allOrders.filter((order) => {
          if (!order.servico) {
            return false;
          }

          const etapaNome =
            order.servico.etapa?.nome || order.etapa?.nome || "PENDENTE";

          const agendamentos = order.servico.agendamentos || [];
          const hasActiveAppointment = agendamentos.some(
            (ag) =>
              ag.tipoAgendamento === tipoValue &&
              ag.statusAgendamento?.nome !== "CANCELADO" &&
              ag.statusAgendamento?.nome !== "INATIVO",
          );

          if (hasActiveAppointment) {
            return false;
          }

          let etapaValida = false;

          if (tipoValue === "ORCAMENTO") {
            const etapasAceitasOrcamento = [
              "PENDENTE",
              "AGUARDANDO ORÇAMENTO",
              "AGUARDANDO ORCAMENTO",
            ];

            etapaValida = etapasAceitasOrcamento.some(
              (e) =>
                etapaNome.toUpperCase().includes(e.toUpperCase()) ||
                e.toUpperCase().includes(etapaNome.toUpperCase()),
            );

            if (!etapaValida && agendamentos.length === 0) {
              etapaValida = true;
            }
          } else if (tipoValue === "SERVICO") {
            const etapasAceitasServico = [
              "ORÇAMENTO APROVADO",
              "ORCAMENTO APROVADO",
              "ANÁLISE DO ORÇAMENTO",
              "ANALISE DO ORCAMENTO",
              "SERVIÇO AGENDADO",
              "SERVICO AGENDADO",
            ];

            etapaValida = etapasAceitasServico.some(
              (e) =>
                etapaNome.toUpperCase().includes(e.toUpperCase()) ||
                e.toUpperCase().includes(etapaNome.toUpperCase()),
            );
          }

          if (!etapaValida) {
            return false;
          }

          return true;
        });

        const options = availableOrders
          .map((dto) => {
            const pedidoId = dto.id || dto.pedidoId || dto.idPedido;

            let label = "";

            if (dto.servico?.nome) {
              label = dto.servico.nome;
            } else if (dto.servico?.descricao) {
              label = dto.servico.descricao;
            } else if (dto.nome) {
              label = dto.nome;
            } else if (dto.descricao) {
              label = dto.descricao;
            } else if (pedidoId) {
              label = `Pedido #${pedidoId}`;
            } else {
              label = `Pedido sem identificação`;
            }

            return {
              value: pedidoId,
              label: label,
              originalData: dto,
            };
          })
          .filter((opt) => opt.value);

        if (initialData?.pedido?.value) {
          const exists = options.find(
            (o) => String(o.value) === String(initialData.pedido.value),
          );
          if (!exists) {
            options.unshift(initialData.pedido);
          }
        }

        setPedidoOptions(options);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        setPedidoOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    },
    [initialData],
  );

  const fetchProdutos = useCallback(async () => {
    try {
      const response = await Api.get("/estoques", { params: { size: 500 } });
      const raw = response.data;
      const dados = raw?.content ?? (Array.isArray(raw) ? raw : []);
      setProdutosOptions(
        dados
          .filter((item) => item.produto?.id)
          .map((item) => ({
            value: item.produto.id,
            label: item.produto?.nome || item.nomeProduto || item.nome || `Produto #${item.produto.id}`,
            estoqueId: item.id,
            originalData: item,
          })),
      );
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutosOptions([]);
    }
  }, []);

  useEffect(() => {
    const tipoValue =
      formData?.tipoAgendamento?.value || formData?.tipoAgendamento;
    if (
      tipoValue &&
      formData?.eventDate &&
      formData?.startTime &&
      formData?.endTime
    ) {
      // Só reseta a seleção de funcionários quando não está editando um agendamento existente
      if (!formData?.id) {
        setSelectedFuncionarios([]);
      }
      fetchFuncionariosDisponiveis(
        formData.eventDate,
        formData.startTime,
        formData.endTime,
        tipoValue,
      );
    } else {
      setFuncionariosOptions([]);
    }
  }, [
    formData?.eventDate,
    formData?.startTime,
    formData?.endTime,
    formData?.id,
    formData?.tipoAgendamento,
    fetchFuncionariosDisponiveis,
  ]);

  const handleTypeChange = (selectedOption) => {
    const typeValue = selectedOption?.value || selectedOption;
    setFormData((prev) => ({
      ...prev,
      tipoAgendamento: selectedOption,
      pedido: null,
    }));
    setSelectedFuncionarios([]);
    fetchOpcoesPedido(typeValue);
  };

  const handlePedidoChange = (selectedPedidoOption) => {
    if (selectedPedidoOption?.originalData) {
      const data = selectedPedidoOption.originalData;
      const tipoValue =
        formData?.tipoAgendamento?.value || formData?.tipoAgendamento;
      const produtosPedido =
        tipoValue === "SERVICO" ? normalizePedidoProdutos(data) : [];

      const cliente = data.cliente || data.servico?.cliente;
      if (cliente) {
        setClienteInfo({
          nome: cliente.nome || "",
          cpf: cliente.cpf || "",
          email: cliente.email || "",
          telefone: cliente.telefone || "",
          status: cliente.status || "",
        });
      } else {
        setClienteInfo(null);
      }

      const end =
        data.endereco ||
        data.cliente?.endereco ||
        (data.cliente?.enderecos && data.cliente.enderecos.length > 0
          ? data.cliente.enderecos[0]
          : null) ||
        data.servico?.cliente?.endereco ||
        (data.servico?.cliente?.enderecos &&
        data.servico.cliente.enderecos.length > 0
          ? data.servico.cliente.enderecos[0]
          : null) ||
        data.servico?.endereco;

      if (end) {
        setSavedAddress(end);
        setUseExistingAddress(true);
        setFormData((prev) => ({
          ...prev,
          pedido: selectedPedidoOption,
          produtos: mergeProdutosPedidoComSelecionados(
            produtosPedido,
            prev.produtos,
          ),
          rua: end.rua || end.logradouro || "",
          numero: end.numero || "",
          cep: end.cep || "",
          bairro: end.bairro || "",
          cidade: end.cidade || "",
          uf: end.uf || "",
          pais: end.pais || "Brasil",
          complemento: end.complemento || "",
        }));
      } else {
        setSavedAddress(null);
        setUseExistingAddress(false);
        setFormData((prev) => ({
          ...prev,
          pedido: selectedPedidoOption,
          produtos: mergeProdutosPedidoComSelecionados(
            produtosPedido,
            prev.produtos,
          ),
        }));
      }
    } else {
      setClienteInfo(null);
      setFormData((prev) => ({ ...prev, pedido: selectedPedidoOption }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleToggleAddressMode = () => {
    if (useExistingAddress && savedAddress) {
      setUseExistingAddress(false);
      setFormData((prev) => ({
        ...prev,
        rua: "",
        numero: "",
        cep: "",
        bairro: "",
        cidade: "",
        uf: "",
        pais: "Brasil",
        complemento: "",
      }));
    } else if (savedAddress) {
      setUseExistingAddress(true);
      setFormData((prev) => ({
        ...prev,
        rua: savedAddress.rua || savedAddress.logradouro || "",
        numero: savedAddress.numero || "",
        cep: savedAddress.cep || "",
        bairro: savedAddress.bairro || "",
        cidade: savedAddress.cidade || "",
        uf: savedAddress.uf || "",
        pais: savedAddress.pais || "Brasil",
        complemento: savedAddress.complemento || "",
      }));
    }
  };

  const handleCepChange = async (value) => {
    const maskedValue = cepMask(value);
    setFormData((prev) => ({ ...prev, cep: maskedValue }));
    if (errors?.cep) setErrors((prev) => ({ ...prev, cep: "" }));
    const cleanCep = maskedValue.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`,
        );
        const data = await response.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            rua: data.logradouro || prev.rua,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            uf: data.uf || prev.uf,
            pais: "Brasil",
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleProdutosSelectChange = (selectedIds) => {
    setFormData((prev) => {
      const currentProducts = prev.produtos || [];
      const keptProducts = currentProducts.filter((p) =>
        selectedIds.includes(p.id),
      );
      const newIds = selectedIds.filter(
        (id) => !currentProducts.some((p) => p.id === id),
      );
      const newProducts = newIds.map((id) => {
        const option = produtosOptions.find((opt) => opt.value === id);
        const existingInitData =
          currentProducts.find((p) => p.id === id) ||
          normalizePedidoProdutos(formData?.pedido?.originalData).find(
            (p) => p.id === id,
          ) ||
          initialData?.produtos?.find((p) => p.id === id);
        return {
          id: id,
          nome: option
            ? option.label
            : existingInitData
              ? existingInitData.nome
              : "Produto",
          quantidade: existingInitData ? existingInitData.quantidade : 1,
          origemPedido: existingInitData?.origemPedido ?? false,
        };
      });
      return { ...prev, produtos: [...keptProducts, ...newProducts] };
    });
  };

  const handleRemoveProduto = (id) => {
    setFormData((prev) => ({
      ...prev,
      produtos: prev.produtos.filter((p) => p.id !== id),
    }));
  };

  const handleProdutoQuantidadeChange = (id, quantidade) => {
    setFormData((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) =>
        p.id === id ? { ...p, quantidade: parseFloat(quantidade) || 1 } : p,
      ),
    }));
  };
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: initialData?.agendamentoId || initialData?.id || null,
        tipoAgendamento: initialData?.tipoAgendamento || "",
        pedido: initialData?.pedido || null,
        funcionarios: initialData?.funcionarios || [],
        produtos: getProdutosIniciais(initialData),
        eventDate: initialData?.eventDate || "",
        startTime: initialData?.startTime || "",
        endTime: initialData?.endTime || "",
        rua: initialData?.rua || "",
        numero: initialData?.numero || "",
        cep: initialData?.cep || "",
        complemento: initialData?.complemento || "",
        bairro: initialData?.bairro || "",
        cidade: initialData?.cidade || "",
        uf: initialData?.uf || "",
        pais: initialData?.pais || "",
        observacao: initialData?.observacao || "",
      });
      setErrors({});
      setSelectedFuncionarios(initialData?.funcionarios || []);
      setStep(1);
      setIsSuccess(false);
      setClienteInfo(null);
      setSavedAddress(null);
      setUseExistingAddress(true);
      if (initialData?.tipoAgendamento) {
        const typeValue =
          initialData.tipoAgendamento.value || initialData.tipoAgendamento;
        setFuncionariosOptions([]);
        fetchOpcoesPedido(typeValue);

        if (initialData.pedido) {
          setPedidoOptions([initialData.pedido]);
        }
      }

      const tipoVal = initialData?.tipoAgendamento?.value || initialData?.tipoAgendamento;
      if (tipoVal === "SERVICO" || initialData?.produtos?.length > 0) {
        fetchProdutos();
      }
    }
  }, [isOpen, initialData, fetchOpcoesPedido, fetchProdutos]);

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      const tipoValue =
        formData?.tipoAgendamento?.value || formData?.tipoAgendamento;
      if (!tipoValue) newErrors.tipoAgendamento = "* Obrigatório";
      if (!formData?.pedido) newErrors.pedido = "* Selecione um pedido";
      if (!formData?.eventDate?.trim()) {
        newErrors.eventDate = "* Obrigatória";
      } else {
        const now = new Date();
      const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const hasDateOrTimeChanged = formData?.eventDate !== initialData?.eventDate || formData?.startTime !== initialData?.startTime;

      if (!formData?.id || hasDateOrTimeChanged) {
        if (formData?.eventDate < todayYMD) {
          newErrors.eventDate = "* Não é permitido agendar no passado";
        } else if (
          formData?.eventDate === todayYMD &&
          formData?.startTime
        ) {
          const [hours, minutes] = formData.startTime.split(":");
          if (
            parseInt(hours) < now.getHours() ||
            (parseInt(hours) === now.getHours() &&
              parseInt(minutes) < now.getMinutes())
          ) {
            newErrors.startTime = "* O horário escolhido já passou";
          }
        }
      }
      }

      if (!formData?.startTime?.trim() && !newErrors.startTime)
        newErrors.startTime = "* Obrigatório";
      if (!formData?.endTime?.trim()) newErrors.endTime = "* Obrigatório";
      
      // Validar que startTime é menor que endTime
      if (formData?.startTime && formData?.endTime) {
        const [startHour, startMinute] = formData.startTime.split(":").map(Number);
        const [endHour, endMinute] = formData.endTime.split(":").map(Number);
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        if (startTotalMinutes >= endTotalMinutes) {
          newErrors.endTime = "* A hora final deve ser maior que a hora inicial";
        }
      }
      
      if (!selectedFuncionarios || selectedFuncionarios.length === 0)
        newErrors.funcionarios = "* Selecione pelo menos um funcionário";
    }
    if (currentStep === 2) {
      if (!formData?.rua?.trim()) newErrors.rua = "* Rua obrigatória";
      if (!formData?.cep?.trim()) newErrors.cep = "* CEP obrigatório";
    }
    if (currentStep === 3) {
      const produtosInvalidos = (formData?.produtos || [])
        .map((produto) => {
          const option = produtosOptions.find((opt) => opt.value === produto.id);
          const disponivel = parseFloat(
            option?.originalData?.quantidadeDisponivel ?? 0,
          );
          const reservado = parseFloat(produto.quantidade) || 0;

          if (reservado <= 0) {
            return `${produto.nome}: informe uma quantidade maior que zero.`;
          }

          if (reservado > disponivel) {
            return `${produto.nome}: disponivel ${disponivel}, solicitado ${reservado}.`;
          }

          return null;
        })
        .filter(Boolean);

      if (produtosInvalidos.length > 0) {
        newErrors.submit = `A selecao dos itens nao pode passar do disponivel. Ajuste as quantidades: ${produtosInvalidos.join(" ")}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatTimeToHHmmss = (timeStr) => {
    if (!timeStr) return "00:00:00";
    const [hour = "00", minute = "00"] = timeStr.split(":");
    return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
  };

  const submitToBackend = async () => {
    setLoading(true);
    try {
      const formatDateToISO = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.includes("-")) return dateStr;
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
      };
      const tipoValor =
        formData.tipoAgendamento?.value || formData.tipoAgendamento;

      const pedidoCompleto = formData.pedido?.originalData || null;

      const produtosPayload = formData.produtos
        .filter((p) => p.id != null)
        .map((p) => ({
          produtoId: parseInt(p.id, 10),
          quantidadeUtilizada: 0.0,
          quantidadeReservada: Math.max(0.01, parseFloat(p.quantidade) || 1),
        }));

      const payload = {
        servicoId: pedidoCompleto?.servico?.id || pedidoCompleto?.id || null,
        tipoAgendamento: tipoValor,
        dataAgendamento: formatDateToISO(formData.eventDate),
        inicioAgendamento: formatTimeToHHmmss(formData.startTime),
        fimAgendamento: formatTimeToHHmmss(formData.endTime),
        statusAgendamento: { tipo: "AGENDAMENTO", nome: "PENDENTE" },
        observacao: formData.observacao || null,
        endereco: {
          rua: formData.rua || "",
          numero: formData.numero || null,
          complemento: formData.complemento || null,
          cep: formData.cep || "",
          cidade: formData.cidade || "",
          bairro: formData.bairro || null,
          uf: formData.uf || "",
          pais: formData.pais || "Brasil",
        },
        funcionariosIds: selectedFuncionarios,
        produtos: produtosPayload,
      };

      let result;
      if (formData.id) {
        result = await Api.put(`/agendamentos/${formData.id}`, payload);
      } else {
        result = await Api.post("/agendamentos", payload);
      }

      if (pedidoCompleto?.id && pedidoCompleto?.servico?.id) {
        try {
          let novaEtapa = "";
          if (tipoValor === "ORCAMENTO") {
            novaEtapa = "AGUARDANDO ORÇAMENTO";
          } else if (tipoValor === "SERVICO") {
            novaEtapa = "SERVIÇO AGENDADO";
          }

          if (novaEtapa) {
            const servicoAtualizado = {
              ...pedidoCompleto.servico,
              etapa: {
                tipo: "SERVICO",
                nome: novaEtapa,
              },
            };

            await Api.put(`/pedidos/${pedidoCompleto.id}`, {
              pedido: {
                valorTotal: pedidoCompleto.valorTotal || 0,
                ativo: true,
                observacao: pedidoCompleto.observacao || "",
                formaPagamento: pedidoCompleto.formaPagamento || "Pix",
                cliente: pedidoCompleto.cliente
                  ? { id: pedidoCompleto.cliente.id }
                  : null,
                status: pedidoCompleto.status || {
                  tipo: "PEDIDO",
                  nome: "Ativo",
                },
              },
              servico: servicoAtualizado,
              produtos: null,
            });
          }
        } catch (error) {
          console.error("⚠️ Erro ao atualizar etapa do pedido:", error);
        }
      }

      setIsSuccess(true);
      onSave?.(result.data);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Submit Error:", error);
      const backendMsg = error?.response?.data?.message;
      setErrors({
        submit: backendMsg || "Erro ao salvar agendamento. Verifique os dados.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validateStep(step)) return;

    const tipoValue =
      formData?.tipoAgendamento?.value || formData?.tipoAgendamento;
    const isOrcamento = tipoValue === "ORCAMENTO";

    if (step === 2 && isOrcamento) {
      await submitToBackend();
      return;
    }

    if (step === 2) {
      setLoading(true);
      await fetchProdutos();
      setLoading(false);
      setStep(3);
      return;
    }

    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    await submitToBackend();
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div
        className={modalClasses.overlay}
        onClick={onClose}
      >
        <div
          className={`${modalClasses.panel} flex w-full max-w-md flex-col items-center justify-center px-8 py-10 text-center`}
          onClick={(e) => e?.stopPropagation()}
        >
          <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="pt-6 pb-2 text-2xl font-bold text-gray-900">
            Agendamento {formData.id ? "Atualizado" : "Criado"}!
          </h2>
          <p className="pb-8 text-gray-500">
            O agendamento foi salvo com sucesso.
          </p>
          <div className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onClick={onClose}
            >
              Concluir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={modalClasses.overlay}
      onClick={onClose}
    >
      <div
        className={`${modalClasses.panel} flex max-h-[92vh] w-full max-w-4xl flex-col`}
        onClick={(e) => e?.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <Calendar className="h-6 w-6" />
            </div>
            <h2 className={modalClasses.headerTitle}>
              {formData.id ? "Editar Agendamento" : "Novo Agendamento"}
            </h2>
          </div>
        </div>

        <div className={modalClasses.stepperSection}>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step >= 1
                    ? "bg-[#007EA7] text-white shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                1
              </div>
              <span
                className={`mt-2 text-center text-sm ${
                  step >= 1
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-500"
                }`}
              >
                Agendamento
              </span>
            </div>

            <div
              className={`mx-3 mb-6 h-1 flex-1 rounded-full ${
                step >= 2 ? "bg-[#007EA7]" : "bg-gray-200"
              }`}
            />

            <div className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step >= 2
                    ? "bg-[#007EA7] text-white shadow-md"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`mt-2 text-center text-sm ${
                  step >= 2
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-500"
                }`}
              >
                Endereco
              </span>
            </div>

            {(formData?.tipoAgendamento?.value === "SERVICO" ||
              formData?.tipoAgendamento === "SERVICO") && (
              <>
                <div
                  className={`mx-3 mb-6 h-1 flex-1 rounded-full ${
                    step >= 3 ? "bg-[#007EA7]" : "bg-gray-200"
                  }`}
                />

                <div className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      step >= 3
                        ? "bg-[#007EA7] text-white shadow-md"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`mt-2 text-center text-sm ${
                      step >= 3
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-500"
                    }`}
                  >
                    Produtos
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`${modalClasses.body} flex flex-1 flex-col gap-6`}
        >
          {errors?.submit && (
            <div className={modalClasses.errorAlert}>
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 rotate-45 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Dados do Agendamento
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Escolha o tipo, vincule o pedido e defina data, horario e equipe.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-4">
                <div className="mb-4 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[#007EA7]" />
                  <span className="text-sm font-semibold text-slate-800">
                    Informacoes principais
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block pb-2 text-sm font-semibold text-gray-700">
                    Tipo de agendamento <span className="text-red-500">*</span>
                  </label>
                  <UniversalInput
                    as="select"
                    value={
                      formData?.tipoAgendamento?.value ||
                      formData?.tipoAgendamento ||
                      ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = categoryOptions.find(
                        (o) => String(o.value) === val,
                      );
                      handleTypeChange(opt);
                    }}
                    options={categoryOptions}
                    placeholder="Selecione o tipo"
                  />
                  {errors?.tipoAgendamento && (
                    <span className="mt-1 text-xs text-red-500">
                      {errors.tipoAgendamento}
                    </span>
                  )}
                </div>
                <div>
                  <label className="block pb-2 text-sm font-semibold text-gray-700">
                    <span>
                      Pedido Vinculado <span className="text-red-500">*</span>
                    </span>
                    {loadingOptions && (
                      <span className="animate-pulse text-xs text-blue-600">
                        Carregando...
                      </span>
                    )}
                  </label>
                  <UniversalInput
                    as="select"
                    value={formData?.pedido?.value || formData?.pedido || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const opt = pedidoOptions.find(
                        (o) => String(o.value) === val,
                      );
                      handlePedidoChange(opt);
                    }}
                    options={pedidoOptions}
                    placeholder={
                      loadingOptions
                        ? "Buscando pedidos..."
                        : "Selecione o pedido"
                    }
                    disabled={
                      !formData?.tipoAgendamento ||
                      loadingOptions ||
                      ((formData?.tipoAgendamento?.value === "SERVICO" ||
                        formData?.tipoAgendamento === "SERVICO") &&
                        pedidoOptions.length === 0)
                    }
                  />
                  {errors?.pedido && (
                    <span className="mt-1 text-xs text-red-500">
                      {errors.pedido}
                    </span>
                  )}
                </div>
              </div>

              {/* Informações do Cliente */}
              {clienteInfo && (
                <div className="mt-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  {/* Cabeçalho: Nome + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {clienteInfo.nome}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        clienteInfo.status === "Ativo"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {clienteInfo.status}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="flex flex-col items-start justify-start gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">
                        CPF: {clienteInfo.cpf || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        Telefone: {clienteInfo.telefone || "-"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="font-semibold break-all text-gray-900">
                        Email: {clienteInfo.email || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="block pb-2 text-sm font-semibold text-gray-700">
                    Data do evento <span className="text-red-500">*</span>
                  </label>
                  <UniversalInput
                    required
                    type="date"
                    min={
                      !initialData
                        ? new Date().toISOString().split("T")[0]
                        : undefined
                    }
                    value={formData?.eventDate}
                    onChange={(e) =>
                      handleInputChange("eventDate", e?.target?.value)
                    }
                    error={errors?.eventDate}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block pb-2 text-sm font-semibold text-gray-700">
                    Horário (Início e Fim){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <UniversalInput
                      type="time"
                      value={formData?.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e?.target?.value)
                      }
                      error={errors?.startTime}
                      className="appearance-none text-center [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                    <span className="pb-1 font-medium text-gray-500">até</span>
                    <UniversalInput
                      type="time"
                      value={formData?.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e?.target?.value)
                      }
                      error={errors?.endTime}
                      className="appearance-none text-center [&::-webkit-calendar-picker-indicator]:hidden"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Funcionários disponíveis{" "}
                  <span className="text-red-500">*</span>
                </label>
                {!formData?.eventDate ||
                !formData?.startTime ||
                !formData?.endTime ? (
                  <p className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-600">
                    <span>⚠️</span> Preencha a data e o horário acima para ver
                    os funcionários disponíveis.
                  </p>
                ) : loadingFuncionarios ? (
                  <p className="animate-pulse p-3 text-sm text-blue-600">
                    Buscando funcionários disponíveis...
                  </p>
                ) : funcionariosOptions.length === 0 ? (
                  <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    Nenhum funcionário disponível neste horário.
                  </p>
                ) : (
                  <MultipleSelectCheckmarks
                    placeholder="Selecione os funcionários"
                    options={funcionariosOptions}
                    value={selectedFuncionarios}
                    onChange={setSelectedFuncionarios}
                  />
                )}
                {errors?.funcionarios && (
                  <span className="mt-1 block text-xs font-medium text-red-500">
                    {errors.funcionarios}
                  </span>
                )}
              </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Endereco do Agendamento
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Confirme ou ajuste o local do atendimento antes de concluir.
                </p>
              </div>
              {savedAddress && (
                <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="mb-1 text-sm font-semibold text-blue-900">
                        {useExistingAddress
                          ? "📍 Usando endereço cadastrado"
                          : "🆕 Cadastrando novo endereço"}
                      </p>
                      {useExistingAddress && (
                        <p className="text-xs text-blue-700">
                          {savedAddress.rua}{savedAddress.numero ? `, ${savedAddress.numero}` : ""} -{" "}
                          {savedAddress.bairro}, {savedAddress.cidade}/
                          {savedAddress.uf}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleAddressMode}
                      className="ml-3 cursor-pointer border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      {useExistingAddress
                        ? "Usar novo endereço"
                        : "Usar endereço cadastrado"}
                    </Button>
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#007EA7]" />
                  <span className="text-sm font-semibold text-slate-800">
                    Dados do local
                  </span>
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-semibold text-gray-700">
                    <span>
                      CEP <span className="text-red-500">*</span>
                    </span>
                    {loadingCep && (
                      <span className="animate-pulse text-xs text-blue-600">
                        Buscando...
                      </span>
                    )}
                  </div>
                  <UniversalInput
                    type="text"
                    value={formData?.cep}
                    onChange={(e) => handleCepChange(e?.target?.value)}
                    placeholder="00000-000"
                    error={errors?.cep}
                    maxLength={9}
                  />
                </div>
                <UniversalInput
                  label="Rua"
                  required
                  value={formData?.rua}
                  onChange={(e) => handleInputChange("rua", e?.target?.value)}
                  placeholder="Nome da rua"
                  error={errors?.rua}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <UniversalInput
                  label="Número"
                  value={formData?.numero}
                  onChange={(e) => handleInputChange("numero", e?.target?.value)}
                  placeholder="Número"
                />
                <UniversalInput
                  label="Complemento"
                  value={formData?.complemento}
                  onChange={(e) =>
                    handleInputChange("complemento", e?.target?.value)
                  }
                  placeholder="Apto, Bloco..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <UniversalInput
                  label="Bairro"
                  value={formData?.bairro}
                  onChange={(e) =>
                    handleInputChange("bairro", e?.target?.value)
                  }
                  placeholder="Bairro"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <UniversalInput
                  label="Cidade"
                  value={formData?.cidade}
                  onChange={(e) =>
                    handleInputChange("cidade", e?.target?.value)
                  }
                  placeholder="Cidade"
                />
                <UniversalInput
                  label="UF"
                  value={formData?.uf}
                  onChange={(e) => handleInputChange("uf", e?.target?.value)}
                  placeholder="UF"
                  maxLength={2}
                />
                <UniversalInput
                  label="País"
                  value={formData?.pais}
                  onChange={(e) => handleInputChange("pais", e?.target?.value)}
                  placeholder="Brasil"
                />
              </div>
              <UniversalInput
                label="Observação"
                value={formData?.observacao}
                onChange={(e) =>
                  handleInputChange("observacao", e?.target?.value)
                }
                placeholder="Observação"
              />
            </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex h-full flex-col gap-4">
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">
                  Produtos Reservados
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Os produtos vinculados ao pedido sao carregados automaticamente, e voce ainda pode adicionar ou remover outros itens.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    Adicionar Produtos (Opcional)
                  </label>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    {formData.produtos.length} itens selecionados
                  </span>
                </div>
                <MultipleSelectCheckmarks
                  options={produtosOptions}
                  value={formData.produtos.map((p) => p.id)}
                  onChange={handleProdutosSelectChange}
                  placeholder="Pesquise e selecione produtos..."
                  className="mb-4"
                />
              </div>
              <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-gray-200">
                <div className="grid grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  <div className="col-span-7 flex items-center gap-2 text-left">
                    <Package size={14} /> Produto
                  </div>
                  <div className="col-span-4 text-center">Qtd. Reserva</div>
                  <div className="col-span-1 text-center">Ação</div>
                </div>
                <div className="flex-1 overflow-y-auto bg-gray-50/30">
                  {formData.produtos.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-gray-400">
                      <Package size={40} className="mb-2 opacity-20" />
                      <p className="text-sm">Nenhum produto selecionado.</p>
                      <p className="mt-1 text-xs">
                        Clique em "Finalizar" para pular esta etapa.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {formData.produtos.map((prod) => (
                        <div
                          key={prod.id}
                          className="grid grid-cols-12 items-center gap-4 bg-white px-4 py-3 transition-colors hover:bg-white"
                        >
                          <div
                            className="col-span-7 truncate text-left text-sm font-medium text-gray-900"
                            title={prod.nome}
                          >
                            {prod.nome}
                          </div>
                          <div className="col-span-4">
                            <UniversalInput
                              type="number"
                              value={prod.quantidade}
                              onChange={(e) =>
                                handleProdutoQuantidadeChange(
                                  prod.id,
                                  e.target.value,
                                )
                              }
                              className="text-center"
                              min={1}
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleRemoveProduto(prod.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className={modalClasses.footer}>
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="secondary" onClick={handleBack}>
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full md:w-auto"
                disabled={loading}
              >
                {loading
                  ? "Salvando..."
                  : step === 2 &&
                      (formData?.tipoAgendamento?.value === "ORCAMENTO" ||
                        formData?.tipoAgendamento === "ORCAMENTO")
                    ? "Finalizar"
                    : step < 3
                      ? "Próxima Etapa"
                      : "Finalizar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreateModal;
