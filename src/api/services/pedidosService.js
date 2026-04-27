import Api from "../client/Api";
import BaseService from "../client/BaseService";

class PedidosService extends BaseService {
  constructor() {
    super(Api);
  }

  normalizarEtapaOuStatus(valor = "") {
    return String(valor)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/_/g, " ")
      .trim()
      .toUpperCase();
  }

  isTipoOrcamentoAgendamento(tipo = "") {
    const tipoNorm = this.normalizarEtapaOuStatus(tipo);
    return tipoNorm.includes("ORC") || tipoNorm.includes("VISTORIA");
  }

  isTipoServicoAgendamento(tipo = "") {
    return !this.isTipoOrcamentoAgendamento(tipo);
  }

  etapaServicoEhObrigatoriaPorAgendamento(servico) {
    if (!servico) return false;

    return (servico.agendamentos || []).some((ag) => {
      const statusNorm = this.normalizarEtapaOuStatus(
        ag?.statusAgendamento?.nome,
      );
      return (
        statusNorm &&
        statusNorm !== "CANCELADO" &&
        statusNorm !== "INATIVO" &&
        statusNorm !== "CONCLUIDO"
      );
    });
  }

  calcularEtapaServicoPorAgendamentos(servico, etapaBase = "PENDENTE") {
    if (!servico) return etapaBase;

    const agendamentosAtivos = (servico.agendamentos || []).filter((ag) => {
      const statusNorm = this.normalizarEtapaOuStatus(
        ag?.statusAgendamento?.nome,
      );
      return (
        statusNorm &&
        statusNorm !== "CANCELADO" &&
        statusNorm !== "INATIVO" &&
        statusNorm !== "CONCLUIDO"
      );
    });

    if (agendamentosAtivos.length === 0) {
      return etapaBase;
    }

    const agendamentoServico = agendamentosAtivos.find((ag) =>
      this.isTipoServicoAgendamento(ag?.tipoAgendamento),
    );
    const agendamentoOrcamento = agendamentosAtivos.find((ag) =>
      this.isTipoOrcamentoAgendamento(ag?.tipoAgendamento),
    );

    if (agendamentoServico) {
      const statusServico = this.normalizarEtapaOuStatus(
        agendamentoServico.statusAgendamento?.nome,
      );

      if (statusServico === "CONCLUIDO") {
        return "CONCLU\u00cdDO";
      }
      if (statusServico === "EM ANDAMENTO" || statusServico === "EM EXECUCAO") {
        return "SERVI\u00c7O EM EXECU\u00c7\u00c3O";
      }
      return "SERVI\u00c7O AGENDADO";
    }

    if (agendamentoOrcamento) {
      const statusOrcamento = this.normalizarEtapaOuStatus(
        agendamentoOrcamento.statusAgendamento?.nome,
      );
      if (statusOrcamento === "CONCLUIDO") {
        return "OR\u00c7AMENTO APROVADO";
      }
      return "AGUARDANDO OR\u00c7AMENTO";
    }

    const orcamentoConcluido = (servico.agendamentos || []).find((ag) => {
      const statusNorm = this.normalizarEtapaOuStatus(ag?.statusAgendamento?.nome);
      return this.isTipoOrcamentoAgendamento(ag?.tipoAgendamento) && statusNorm === "CONCLUIDO";
    });
    if (orcamentoConcluido) return "OR\u00c7AMENTO APROVADO";

    return etapaBase;
  }

  async buscarTodos() {
    const result = await this.get("/pedidos");
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  async buscarPedidosDeServico() {
    const result = await this.get("/pedidos/servicos");
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  async buscarServicosEndpoint() {
    const result = await this.get("/servicos");
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  mapearServicoSimples(servico) {
    const progresso = Array.isArray(servico.progresso)
      ? servico.progresso
      : [1, 6];
    return {
      id: servico.id,
      clienteNome: servico.clienteNome || "Não informado",
      clienteId: servico.clienteId,
      clienteInfo: { nome: servico.clienteNome || "Não informado" },
      produtosDesc: servico.descricao || "Serviço não especificado",
      descricao: servico.descricao || "",
      dataCompra: servico.data || new Date().toISOString().slice(0, 10),
      data: servico.data || new Date().toISOString().slice(0, 10),
      formaPagamento: servico.formaPagamento || "Não informado",
      itensCount: 1,
      valorTotal: servico.valorTotal || 0,
      status: servico.status || "Ativo",
      ativo: servico.ativo !== false,
      tipoPedido: "servico",
      etapa: servico.etapa || "Aguardando orçamento",
      etapaOriginal: servico.etapa || null,
      progresso,
      servicoNome: servico.descricao || null,
      produtos: [],
      servico: {
        id: servico.id,
        nome: servico.descricao || "Serviço",
        descricao: servico.descricao || "",
        etapa: servico.etapa || "Aguardando orçamento",
        agendamentos: [],
      },
      observacoes: servico.observacoes || "",
      statusOriginal: null,
      _origem: "servicos",
    };
  }

  async buscarPedidosDeProduto() {
    const result = await this.get("/pedidos/produtos");
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  buscarPorId(id) {
    return this.get(`/pedidos/${id}`);
  }

  async buscarPorTipoAndEtapa(nomeEtapa) {
    const result = await this.get("/pedidos/findAllBy", {
      params: { nome: nomeEtapa },
    });
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  async criarPedido(pedidoData) {
    if (!pedidoData.pedido) {
      return {
        success: false,
        data: null,
        error: "Dados do pedido são obrigatórios",
        status: 400,
      };
    }
    const result = await this.post("/pedidos", pedidoData);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  async atualizarPedido(id, pedidoData) {
    const result = await this.put(`/pedidos/${id}`, pedidoData);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  async atualizarServico(id, pedidoData) {
    return this.atualizarPedido(id, pedidoData);
  }

  deletarPedido(id) {
    return this.delete(`/pedidos/${id}`);
  }

  async deletarServico(id) {
    return this.deletarPedido(id);
  }

  mapearParaBackend(dadosFrontend) {
    const pedidoBase = {
      valorTotal: dadosFrontend.valorTotal || 0,
      ativo: dadosFrontend.ativo !== false,
      observacao: dadosFrontend.descricao || dadosFrontend.observacoes || "",
      formaPagamento: dadosFrontend.formaPagamento || "Pix",
      cliente: dadosFrontend.clienteId ? { id: dadosFrontend.clienteId } : null,
      status: {
        tipo: "PEDIDO",
        nome: dadosFrontend.status || "Ativo",
      },
    };

    const pedidoRequest = {
      pedido: pedidoBase,
      servico: null,
      produtos: null,
    };

    if (
      dadosFrontend.tipo === "SERVICO" ||
      dadosFrontend.tipoPedido === "servico"
    ) {
      if (dadosFrontend.servicos && dadosFrontend.servicos.length > 0) {
        const primeiroServico = dadosFrontend.servicos[0];
        pedidoRequest.servico = {
          nome: primeiroServico.nome || "Serviço",
          descricao: dadosFrontend.descricao || primeiroServico.descricao || "",
          precoBase: primeiroServico.preco || dadosFrontend.valorTotal || 0,
          ativo: true,
          etapa: primeiroServico.etapa || null,
        };
      }
    } else if (
      dadosFrontend.tipo === "PRODUTO" ||
      dadosFrontend.tipoPedido === "produto"
    ) {
      if (dadosFrontend.produtos && dadosFrontend.produtos.length > 0) {
        pedidoRequest.produtos = dadosFrontend.produtos.map((produto) => ({
          estoqueId: produto.produtoId || produto.estoqueId,
          quantidadeSolicitada: produto.quantidade || 1,
          precoUnitarioNegociado: produto.preco || 0,
          observacao: produto.observacao || "",
        }));
      }
    }

    return pedidoRequest;
  }

  mapearParaFrontend(dadosBackend) {
    const tipoPedidoNorm = dadosBackend.tipoPedido?.toLowerCase().replace(/[çc]/g, "c") ?? "";
    const isProduto =
      tipoPedidoNorm === "produto" &&
      dadosBackend.produtos &&
      dadosBackend.produtos.length > 0;
    const isServico =
      dadosBackend.servico != null &&
      (tipoPedidoNorm.includes("servi") || !tipoPedidoNorm.includes("produto"));

    let produtosDesc = "";
    let itensCount = 0;
    let produtos = [];

    if (dadosBackend.produtos && dadosBackend.produtos.length > 0) {
      produtos = dadosBackend.produtos.map((produto) => ({
        nome: produto.nomeProduto || produto.nome || "Produto",
        quantidade: produto.quantidadeSolicitada || 0,
        preco: produto.precoUnitarioNegociado || 0,
        estoqueId: produto.estoqueId,
        subtotal: produto.subtotal || 0,
        observacao: produto.observacao || "",
      }));

      if (isProduto) {
        produtosDesc = produtos.map((p) => p.nome).join(", ");
        itensCount = produtos.length;
      }
    }

    let servicoInfo = null;
    let etapaAtual = "Aguardando orçamento";
    let progressoValor = 1;
    let progressoTotal = 7;
    let temAgendamentoAtivo = false;

    let etapaCalculada = "PENDENTE";

    if (isServico && dadosBackend.servico) {
      const etapaNome = dadosBackend.servico.etapa?.nome || "PENDENTE";

      etapaCalculada = etapaNome;

      const agendamentosTodos = dadosBackend.servico.agendamentos || [];
      const agendamentosAtivos = agendamentosTodos.filter(
        (ag) =>
          ag.statusAgendamento?.nome &&
          ag.statusAgendamento.nome !== "CANCELADO" &&
          ag.statusAgendamento.nome !== "INATIVO" &&
          ag.statusAgendamento.nome !== "CONCLUÍDO" &&
          ag.statusAgendamento.nome !== "CONCLUIDO",
      );
      temAgendamentoAtivo = agendamentosAtivos.length > 0;

      if (agendamentosAtivos.length > 0) {
        const agendamentoOrcamento = agendamentosAtivos.find(
          (ag) => ag.tipoAgendamento === "ORCAMENTO",
        );
        const agendamentoServico = agendamentosAtivos.find(
          (ag) => ag.tipoAgendamento === "SERVICO",
        );

        if (agendamentoServico) {
          const statusServico = agendamentoServico.statusAgendamento?.nome;
          if (statusServico === "CONCLUÍDO") etapaCalculada = "CONCLUÍDO";
          else if (statusServico === "EM ANDAMENTO")
            etapaCalculada = "SERVIÇO EM EXECUÇÃO";
          else etapaCalculada = "SERVIÇO AGENDADO"; 
        }

        else if (agendamentoOrcamento) {
          const statusOrcamento = this.normalizarEtapaOuStatus(agendamentoOrcamento.statusAgendamento?.nome);
          if (statusOrcamento === "CONCLUIDO") {
            etapaCalculada = "OR\u00c7AMENTO APROVADO";
          } else {
            etapaCalculada = "AGUARDANDO OR\u00c7AMENTO";
          }
        }
      } else {
        etapaCalculada = etapaNome;
      }

      etapaCalculada = this.calcularEtapaServicoPorAgendamentos(
        dadosBackend.servico,
        etapaNome,
      );

      servicoInfo = {
        id: dadosBackend.servico.id,
        codigo: dadosBackend.servico.codigo,
        nome: dadosBackend.servico.nome || "Serviço sem nome",
        descricao: dadosBackend.servico.descricao || "",
        precoBase: dadosBackend.servico.precoBase || 0,
        ativo: dadosBackend.ativo === false ? false : (temAgendamentoAtivo ? true : dadosBackend.servico.ativo),
        etapa: etapaCalculada, 
        agendamentos: agendamentosTodos, 
      };

      produtosDesc = servicoInfo.nome;
      itensCount = 1;

      const etapaNorm = this.normalizarEtapaOuStatus(etapaCalculada);
      switch (etapaNorm) {
        case "PENDENTE":
          etapaAtual = "Pendente";
          progressoValor = 1;
          break;
        case "AGUARDANDO ORCAMENTO":
          etapaAtual = "Aguardando Or\u00e7amento";
          progressoValor = 2;
          break;
        case "ANALISE DO ORCAMENTO":
          etapaAtual = "An\u00e1lise do Or\u00e7amento";
          progressoValor = 3;
          break;
        case "ORCAMENTO APROVADO":
          etapaAtual = "Or\u00e7amento Aprovado";
          progressoValor = 4;
          break;
        case "SERVICO AGENDADO":
          etapaAtual = "Servi\u00e7o Agendado";
          progressoValor = 5;
          break;
        case "SERVICO EM EXECUCAO":
          etapaAtual = "Servi\u00e7o em Execu\u00e7\u00e3o";
          progressoValor = 6;
          break;
        case "CONCLUIDO":
          etapaAtual = "Conclu\u00eddo";
          progressoValor = 7;
          break;
        case "CANCELADO":
          etapaAtual = "Cancelado";
          progressoValor = 0;
          break;
        default:
          etapaAtual = etapaCalculada;
          progressoValor = 1;
      }
    }

    const statusNome = dadosBackend.status?.nome || "Ativo";
    let statusMapeado = statusNome;

    switch (statusNome.toUpperCase()) {
      case "ATIVO":
        statusMapeado = "Ativo";
        break;
      case "FINALIZADO":
      case "INATIVO":
        statusMapeado = "Inativo";
        break;
      case "PENDENTE":
        statusMapeado = "Ativo";
        break;
      case "CANCELADO":
        statusMapeado = "Cancelado";
        break;
      default:
        statusMapeado = statusNome;
    }

    if (isServico && temAgendamentoAtivo) {
      statusMapeado = "Ativo";
    }

    if (etapaAtual === "Concluído") {
      statusMapeado = "Inativo";
    }

    if (dadosBackend.ativo === false) {
      statusMapeado = "Inativo";
    }

    let dataCompra = dadosBackend.dataCompra;
    if (!dataCompra && dadosBackend.servico?.createdAt) {
      const createdDate = new Date(dadosBackend.servico.createdAt);
      dataCompra = createdDate.toISOString().slice(0, 10);
    }
    if (!dataCompra) {
      dataCompra = new Date().toISOString().slice(0, 10);
    }

    const clienteNome = dadosBackend.cliente?.nome;
    const clienteNomeFinal =
      clienteNome && clienteNome.trim() ? clienteNome : "Não informado";

    return {
      id: dadosBackend.id,
      clienteNome: clienteNomeFinal,
      clienteId: dadosBackend.cliente?.id,
      clienteInfo: {
        nome: clienteNomeFinal,
        cpf: dadosBackend.cliente?.cpf || "",
        email: dadosBackend.cliente?.email || "",
        telefone: dadosBackend.cliente?.telefone || "",
        endereco: dadosBackend.cliente?.enderecos?.[0] || null,
      },
      produtosDesc:
        produtosDesc ||
        (isProduto ? "Produtos não especificados" : "Serviço não especificado"),
      descricao:
        dadosBackend.descricao || dadosBackend.servico?.descricao || "",
      dataCompra: dataCompra,
      data: dataCompra,
      formaPagamento: dadosBackend.formaPagamento || "Não informado",
      itensCount: itensCount,
      valorTotal: dadosBackend.valorTotal || 0,
      status: statusMapeado,
      ativo: etapaAtual === "Concluído" ? false : isServico && temAgendamentoAtivo ? true : dadosBackend.ativo !== false,
      tipoPedido:
        dadosBackend.tipoPedido || (isProduto ? "produto" : "servico"),

      etapa: etapaAtual,
      etapaOriginal: isServico ? etapaCalculada : null,
      progresso: [progressoValor, progressoTotal],
      servicoNome: servicoInfo?.nome || null,

      produtos: produtos,
      servico: servicoInfo,

      observacoes: dadosBackend.descricao || "",
      statusOriginal: dadosBackend.status,
    };
  }

  filtrarPedidos(pedidos, filtros = {}) {
    let pedidosFiltrados = [...pedidos];

    if (
      filtros.status &&
      filtros.status !== "Todos" &&
      filtros.status.length > 0
    ) {
      const statusArray = Array.isArray(filtros.status)
        ? filtros.status
        : [filtros.status];
      if (!statusArray.includes("Todos")) {
        pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
          statusArray.includes(pedido.status),
        );
      }
    }

    if (
      filtros.pagamento &&
      filtros.pagamento !== "Todos" &&
      filtros.pagamento.length > 0
    ) {
      const pagamentoArray = Array.isArray(filtros.pagamento)
        ? filtros.pagamento
        : [filtros.pagamento];
      if (!pagamentoArray.includes("Todos")) {
        pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
          pagamentoArray.includes(pedido.formaPagamento),
        );
      }
    }

    if (
      filtros.etapa &&
      filtros.etapa !== "Todos" &&
      filtros.etapa.length > 0
    ) {
      const etapaArray = Array.isArray(filtros.etapa)
        ? filtros.etapa
        : [filtros.etapa];
      if (!etapaArray.includes("Todos")) {
        pedidosFiltrados = pedidosFiltrados.filter(
          (pedido) =>
            pedido.servico && etapaArray.includes(pedido.servico.etapa?.nome),
        );
      }
    }

    if (filtros.busca && filtros.busca.trim()) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter((pedido) =>
        [
          pedido.id?.toString().padStart(3, "0"),
          pedido.clienteNome,
          pedido.produtosDesc,
          pedido.descricao,
          pedido.formaPagamento,
        ]
          .join(" ")
          .toLowerCase()
          .includes(termoBusca),
      );
    }

    return pedidosFiltrados;
  }

  filtrarServicos(servicos, filtros = {}) {
    let servicosFiltrados = [...servicos];

    if (
      filtros.status &&
      filtros.status !== "Todos" &&
      filtros.status.length > 0
    ) {
      const statusArray = Array.isArray(filtros.status)
        ? filtros.status
        : [filtros.status];
      if (!statusArray.includes("Todos")) {
        const wantAtivos = statusArray.includes("Ativos");
        const wantInativos = statusArray.includes("Inativos");
        if (wantAtivos && !wantInativos) {
          servicosFiltrados = servicosFiltrados.filter(
            (servico) => servico.etapa !== "Concluído",
          );
        } else if (wantInativos && !wantAtivos) {
          servicosFiltrados = servicosFiltrados.filter(
            (servico) => servico.etapa === "Concluído",
          );
        } else if (!wantAtivos && !wantInativos) {
          servicosFiltrados = servicosFiltrados.filter((servico) =>
            statusArray.includes(servico.status),
          );
        }
      }
    }

    if (
      filtros.etapa &&
      filtros.etapa !== "Todos" &&
      filtros.etapa.length > 0
    ) {
      const etapaArray = Array.isArray(filtros.etapa)
        ? filtros.etapa
        : [filtros.etapa];
      if (!etapaArray.includes("Todos")) {
        servicosFiltrados = servicosFiltrados.filter((servico) =>
          etapaArray.includes(servico.etapa),
        );
      }
    }

    if (filtros.busca && filtros.busca.trim()) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      servicosFiltrados = servicosFiltrados.filter((servico) =>
        [servico.clienteNome, servico.servicoNome, servico.produtosDesc]
          .join(" ")
          .toLowerCase()
          .includes(termoBusca),
      );
    }

    const ACTIVE_STATUSES = ["Ativo", "Em Andamento", "Aguardando"];
    const isTodosFilter =
      !filtros.status ||
      filtros.status === "Todos" ||
      filtros.status.length === 0;
    if (isTodosFilter) {
      servicosFiltrados.sort((a, b) => {
        const aActive = ACTIVE_STATUSES.includes(a.status) ? 0 : 1;
        const bActive = ACTIVE_STATUSES.includes(b.status) ? 0 : 1;
        return aActive - bActive;
      });
    }

    return servicosFiltrados;
  }
}

export default new PedidosService();

