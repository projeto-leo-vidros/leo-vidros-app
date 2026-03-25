import { useState, useEffect, useCallback } from "react";
import { X, Check, Trash2, CheckCircle, Package } from "lucide-react";
import Api from "../../../api/client/Api";
import { cepMask } from "../../../utils/masks";
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
    cep: "",
    numero: "",
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
          allOrders = responseServicos.data || [];
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

            if (dto.descricao) {
              label = dto.descricao;
            } else if (dto.nome) {
              label = dto.nome;
            } else if (dto.servico?.nome) {
              label = dto.servico.nome;
            } else if (dto.servico?.descricao) {
              label = dto.servico.descricao;
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
      const response = await Api.get("/produtos");
      const dados = response.data || [];
      setProdutosOptions(
        dados.map((prod) => ({
          value: prod.id,
          label: prod.nome || prod.descricao || `Produto ${prod.id}`,
          originalData: prod,
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
      setSelectedFuncionarios([]);
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
          rua: end.rua || end.logradouro || "",
          cep: end.cep || "",
          numero:
            end.numero !== null && end.numero !== undefined
              ? String(end.numero)
              : "",
          bairro: end.bairro || "",
          cidade: end.cidade || "",
          uf: end.uf || "",
          pais: end.pais || "Brasil",
          complemento: end.complemento || "",
        }));
      } else {
        setSavedAddress(null);
        setUseExistingAddress(false);
        setFormData((prev) => ({ ...prev, pedido: selectedPedidoOption }));
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
        cep: "",
        numero: "",
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
        cep: savedAddress.cep || "",
        numero:
          savedAddress.numero !== null && savedAddress.numero !== undefined
            ? String(savedAddress.numero)
            : "",
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
        const existingInitData = initialData?.produtos?.find(
          (p) => p.id === id,
        );
        return {
          id: id,
          nome: option
            ? option.label
            : existingInitData
              ? existingInitData.nome
              : "Produto",
          quantidade: existingInitData ? existingInitData.quantidade : 1,
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
        id: initialData?.id || null,
        tipoAgendamento: initialData?.tipoAgendamento || "",
        pedido: initialData?.pedido || null,
        funcionarios: initialData?.funcionarios || [],
        produtos: initialData?.produtos || [],
        eventDate: initialData?.eventDate || "",
        startTime: initialData?.startTime || "",
        endTime: initialData?.endTime || "",
        rua: initialData?.rua || "",
        cep: initialData?.cep || "",
        numero: initialData?.numero || "",
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

      if (initialData?.produtos?.length > 0) {
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
      if (!formData?.eventDate?.trim()) {
        newErrors.eventDate = "* Obrigatória";
      } else if (!formData?.id) {
        const selectedDate = new Date(formData.eventDate + "T00:00:00");
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        if (selectedDate < todayDate) {
          newErrors.eventDate = "* Não é permitido agendar no passado";
        } else if (
          selectedDate.getTime() === todayDate.getTime() &&
          formData?.startTime
        ) {
          const [hours, minutes] = formData.startTime.split(":");
          const now = new Date();
          if (
            parseInt(hours) < now.getHours() ||
            (parseInt(hours) === now.getHours() &&
              parseInt(minutes) < now.getMinutes())
          ) {
            newErrors.startTime = "* O horário escolhido já passou";
          }
        }
      }

      if (!formData?.startTime?.trim() && !newErrors.startTime)
        newErrors.startTime = "* Obrigatório";
      if (!formData?.endTime?.trim()) newErrors.endTime = "* Obrigatório";
      if (!selectedFuncionarios || selectedFuncionarios.length === 0)
        newErrors.funcionarios = "* Selecione pelo menos um funcionário";
    }
    if (currentStep === 2) {
      if (!formData?.rua?.trim()) newErrors.rua = "* Rua obrigatória";
      if (!formData?.cep?.trim()) newErrors.cep = "* CEP obrigatório";
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

      const funcionariosPayload = selectedFuncionarios.map((funcId) => {
        const funcEncontrado = funcionariosOptions.find(
          (f) => f.value === funcId,
        );
        return {
          id: funcId,
          nome: funcEncontrado?.label || "",
          telefone: "",
          funcao: "",
          contrato: "",
          escala: "",
          status: true,
        };
      });

      const pedidoCompleto = formData.pedido?.originalData || null;
      // Mantém a etapa do pedido como está ou default, o backend irá atualizar automaticamente ao criar o agendamento
      const servicoPayload = pedidoCompleto?.servico
        ? {
            id: pedidoCompleto.servico.id,
            codigo: pedidoCompleto.servico.codigo,
            nome: pedidoCompleto.servico.nome,
            descricao: pedidoCompleto.servico.descricao,
            precoBase: pedidoCompleto.servico.precoBase,
            ativo: true,
            etapa: pedidoCompleto.servico.etapa || {
              id: 0,
              tipo: "SERVICO",
              nome: "PENDENTE",
            },
          }
        : {
            id: 0,
            codigo: `auto_${Date.now()}`,
            nome: "",
            descricao: "",
            precoBase: 0.0,
            ativo: true,
            etapa: { id: 0, tipo: "SERVICO", nome: "PENDENTE" },
          };

      const produtosPayload = formData.produtos
        .filter((p) => p.id != null)
        .map((p) => ({
          produtoId: parseInt(p.id, 10),
          quantidadeUtilizada: 0.0,
          quantidadeReservada: parseFloat(p.quantidade) || 0.0,
        }));

      const payload = {
        id: formData.id,
        servico: servicoPayload,
        tipoAgendamento: tipoValor,
        dataAgendamento: formatDateToISO(formData.eventDate),
        inicioAgendamento: formatTimeToHHmmss(formData.startTime),
        fimAgendamento: formatTimeToHHmmss(formData.endTime),
        statusAgendamento: { tipo: "AGENDAMENTO", nome: "PENDENTE" },
        observacao: formData.observacao || "",
        endereco: {
          rua: formData.rua || "",
          complemento: formData.complemento || "",
          cep: formData.cep || "",
          cidade: formData.cidade || "",
          bairro: formData.bairro || "",
          uf: formData.uf || "",
          pais: formData.pais || "",
          numero: formData.numero ? parseInt(formData.numero, 10) : 0,
        },
        funcionarios: funcionariosPayload,
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
        className="bg-opacity-50 fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex w-full max-w-md scale-100 transform flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-3 p-10 text-center shadow-2xl transition-all"
          onClick={(e) => e?.stopPropagation()}
        >
          <div className="flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-green-100 pb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="pb-2 text-2xl font-bold text-gray-900">
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
      className="bg-opacity-50 fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e?.stopPropagation()}
      >
        <div className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {formData.id ? "Editar Agendamento" : "Novo Agendamento"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="cursor-pointer"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= 1 ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-600"}`}
            >
              1
            </div>
            <span
              className={`text-xs font-medium transition-colors ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}
            >
              Agendamento
            </span>
          </div>
          <div
            className={`h-1 w-12 rounded ${step >= 2 ? "bg-blue-600" : "bg-gray-200"} -mt-5`}
          ></div>
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
            >
              2
            </div>
            <span
              className={`text-xs font-medium transition-colors ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}
            >
              Endereço
            </span>
          </div>
          {(formData?.tipoAgendamento?.value === "SERVICO" ||
            formData?.tipoAgendamento === "SERVICO") && (
            <>
              <div
                className={`h-1 w-12 rounded ${step >= 3 ? "bg-blue-600" : "bg-gray-200"} -mt-5`}
              ></div>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  3
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}
                >
                  Produtos
                </span>
              </div>
            </>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-2 pb-6"
        >
          {errors?.submit && (
            <div className="flex items-center rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <X size={16} className="mr-2" />
              {errors.submit}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <>
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
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  {/* Cabeçalho: Nome + Status */}
                  <div className="flex items-center justify-between justify-center gap-2">
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

              <div className="grid grid-cols-2 gap-6">
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
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
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
                          {savedAddress.rua}, {savedAddress.numero || "S/N"} -{" "}
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
              <div className="grid grid-cols-3 gap-4">
                <UniversalInput
                  label="Número"
                  value={formData?.numero}
                  onChange={(e) =>
                    handleInputChange("numero", e?.target?.value)
                  }
                  placeholder="Nº"
                />
                <UniversalInput
                  label="Complemento"
                  value={formData?.complemento}
                  onChange={(e) =>
                    handleInputChange("complemento", e?.target?.value)
                  }
                  placeholder="Apto, Bloco..."
                />
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
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex h-full flex-col gap-4">
              <div>
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
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
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
                      ? "Próximo"
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
