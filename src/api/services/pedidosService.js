import Api from "../client/Api";
import BaseService from "../client/BaseService";

class PedidosService extends BaseService {
  constructor() {
    super(Api);
  }

  async buscarTodos({ page = 0, size = 20 } = {}) {
    const result = await this.get("/pedidos", { params: { page, size } });
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  async buscarPedidosDeServico({ page = 0, size = 20 } = {}) {
    const result = await this.get("/pedidos/servicos", { params: { page, size } });
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  async buscarPedidosDeProduto({ page = 0, size = 20 } = {}) {
    const result = await this.get("/pedidos/produtos", { params: { page, size } });
    if (result.success) result.data = result.data?.content ?? result.data ?? [];
    return result;
  }

  buscarPorId(id) {
    return this.get(`/pedidos/${id}`);
  }

  async buscarPorTipoAndEtapa(nomeEtapa, { page = 0, size = 20 } = {}) {
    const result = await this.get("/pedidos/findAllBy", {
      params: { nome: nomeEtapa, page, size },
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
    const isProduto =
      dadosBackend.tipoPedido === "produto" &&
      dadosBackend.produtos &&
      dadosBackend.produtos.length > 0;
    const isServico =
      dadosBackend.tipoPedido === "serviço" && dadosBackend.servico;

    let produtosDesc = "";
    let itensCount = 0;
    let produtos = [];

    if (isProduto && dadosBackend.produtos) {
      produtos = dadosBackend.produtos.map((produto) => ({
        nome: produto.nomeProduto || "Produto",
        quantidade: produto.quantidadeSolicitada || 0,
        preco: produto.precoUnitarioNegociado || 0,
        estoqueId: produto.estoqueId,
        subtotal: produto.subtotal || 0,
        observacao: produto.observacao || "",
      }));

      produtosDesc = produtos.map((p) => p.nome).join(", ");
      itensCount = produtos.length;
    }

    let servicoInfo = null;
    let etapaAtual = "Aguardando orçamento";
    let progressoValor = 1;
    let progressoTotal = 7;

    let etapaCalculada = "PENDENTE";

    if (isServico && dadosBackend.servico) {
      const etapaNome = dadosBackend.servico.etapa?.nome || "PENDENTE";

      etapaCalculada = etapaNome;

      const agendamentosTodos = dadosBackend.servico.agendamentos || [];
      const agendamentosAtivos = agendamentosTodos.filter(
        (ag) =>
          ag.statusAgendamento?.nome &&
          ag.statusAgendamento.nome !== "CANCELADO" &&
          ag.statusAgendamento.nome !== "INATIVO",
      );

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
          const statusOrcamento = agendamentoOrcamento.statusAgendamento?.nome;

          if (statusOrcamento === "CONCLUÍDO") {
            if (etapaNome === "ORÇAMENTO APROVADO") {
              etapaCalculada = "ORÇAMENTO APROVADO";
            } else {
              etapaCalculada = "ANÁLISE DO ORÇAMENTO";
            }
          } else if (
            statusOrcamento === "EM ANDAMENTO" ||
            statusOrcamento === "PENDENTE"
          ) {
            etapaCalculada = "AGUARDANDO ORÇAMENTO";
          }
        }
      } else {
 
        etapaCalculada = "PENDENTE";
      }

      servicoInfo = {
        id: dadosBackend.servico.id,
        codigo: dadosBackend.servico.codigo,
        nome: dadosBackend.servico.nome || "Serviço sem nome",
        descricao: dadosBackend.servico.descricao || "",
        precoBase: dadosBackend.servico.precoBase || 0,
        ativo: dadosBackend.servico.ativo,
        etapa: etapaCalculada, 
        agendamentos: agendamentosTodos, 
      };

      produtosDesc = servicoInfo.nome;
      itensCount = 1;

      switch (etapaCalculada.toUpperCase()) {
        case "PENDENTE":
          etapaAtual = "Pendente";
          progressoValor = 1;
          break;
        case "AGUARDANDO ORÇAMENTO":
          etapaAtual = "Aguardando Orçamento";
          progressoValor = 2;
          break;
        case "ANÁLISE DO ORÇAMENTO":
          etapaAtual = "Análise do Orçamento";
          progressoValor = 3;
          break;
        case "ORÇAMENTO APROVADO":
          etapaAtual = "Orçamento Aprovado";
          progressoValor = 4;
          break;
        case "SERVIÇO AGENDADO":
          etapaAtual = "Serviço Agendado";
          progressoValor = 5;
          break;
        case "SERVIÇO EM EXECUÇÃO":
          etapaAtual = "Serviço em Execução";
          progressoValor = 6;
          break;
        case "CONCLUÍDO":
          etapaAtual = "Concluído";
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
        statusMapeado = "Finalizado";
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
      ativo: dadosBackend.ativo !== false,
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
        servicosFiltrados = servicosFiltrados.filter((servico) =>
          statusArray.includes(servico.status),
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
        servicosFiltrados = servicosFiltrados.filter((servico) =>
          etapaArray.includes(servico.etapa),
        );
      }
    }

    if (filtros.busca && filtros.busca.trim()) {
      const termoBusca = filtros.busca.toLowerCase().trim();
      servicosFiltrados = servicosFiltrados.filter((servico) =>
        [
          servico.id?.toString().padStart(3, "0"),
          servico.clienteNome,
          servico.descricao,
          servico.etapa,
          servico.servicoNome,
          servico.produtosDesc,
        ]
          .join(" ")
          .toLowerCase()
          .includes(termoBusca),
      );
    }

    return servicosFiltrados;
  }
}

export default new PedidosService();
