import Api from "../client/Api";
import BaseService from "../client/BaseService";

class ServicosService extends BaseService {
  constructor() {
    super(Api);
  }

  async buscarTodos({ page = 0, size = 20 } = {}) {
    const result = await this.get("/Pedidos", { params: { page, size } });
    if (result.success) {
      const items = result.data?.content ?? result.data ?? [];
      result.data = items.filter((pedido) => pedido.servico);
    }
    return result;
  }

  async buscarPorId(id) {
    const result = await this.get(`/Pedidos/${id}`);
    if (result.success && !result.data?.servico) {
      return {
        success: false,
        data: null,
        error: "Este pedido não é um serviço",
        status: 400,
      };
    }
    return result;
  }

  async buscarPorEtapa(nomeEtapa, { page = 0, size = 20 } = {}) {
    const result = await this.get("/Pedidos/findAllBy", {
      params: { nome: nomeEtapa, page, size },
    });
    if (result.success) {
      const items = result.data?.content ?? result.data ?? [];
      result.data = items.filter((pedido) => pedido.servico);
    }
    return result;
  }


  async criarServico(servicoData) {
    if (!servicoData.servico) {
      return {
        success: false,
        data: null,
        error: "Dados do serviço são obrigatórios",
        status: 400,
      };
    }
    const result = await this.post("/Pedidos", servicoData);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  async atualizarServico(id, servicoData) {
    const result = await this.put(`/Pedidos/${id}`, servicoData);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  deletarServico(id) {
    return this.delete(`/Pedidos/${id}`);
  }

  mapearParaBackend(dadosFrontend) {
    const servicoRequest = {
      pedido: {
        dataCompra:
          dadosFrontend.data || new Date().toISOString().split("T")[0],
        valorTotal: dadosFrontend.valorTotal || 0,
        observacoes: dadosFrontend.descricao || "",
        cliente: dadosFrontend.clienteId
          ? { id: dadosFrontend.clienteId }
          : null,
        status: dadosFrontend.status
          ? {
              tipo: "SERVICO",
              nome: dadosFrontend.status,
            }
          : null,
      },
      servico: {
        nome: dadosFrontend.nome || "Serviço",
        descricao: dadosFrontend.descricao || "",
        precoBase: dadosFrontend.precoBase || 0,
        ativo: dadosFrontend.ativo !== false,
        etapa: dadosFrontend.etapa
          ? {
              nome: dadosFrontend.etapa,
            }
          : null,
      },
      produtos: [],
    };

    return servicoRequest;
  }

  mapearParaFrontend(dadosBackend) {
    const progressoInfo = this.calcularProgresso(
      dadosBackend.servico?.etapa?.nome,
    );

    return {
      id: dadosBackend.id,
      clienteId: dadosBackend.cliente?.id,
      clienteNome: dadosBackend.cliente?.nome || "Cliente não informado",
      data: dadosBackend.dataCompra,
      descricao:
        dadosBackend.servico?.descricao || dadosBackend.observacoes || "",
      status: dadosBackend.status?.nome || "Ativo",
      etapa: dadosBackend.servico?.etapa?.nome || "Aguardando orçamento",
      progresso: [progressoInfo.atual, progressoInfo.total],
      valorTotal: dadosBackend.valorTotal || 0,
      observacoes: dadosBackend.observacoes || "",
      servico: {
        nome: dadosBackend.servico?.nome || "Serviço",
        descricao: dadosBackend.servico?.descricao || "",
        precoBase: dadosBackend.servico?.precoBase || 0,
        ativo: dadosBackend.servico?.ativo !== false,
        etapa: dadosBackend.servico?.etapa,
      },
    };
  }

  calcularProgresso(nomeEtapa) {
    const etapas = {
      "Aguardando orçamento": { atual: 1, total: 6 },
      "Orçamento aprovado": { atual: 2, total: 6 },
      "Aguardando peças": { atual: 2, total: 6 },
      "Execução em andamento": { atual: 4, total: 6 },
      "Aguardando aprovação": { atual: 5, total: 6 },
      Concluído: { atual: 6, total: 6 },
      Finalizado: { atual: 6, total: 6 },
    };

    return etapas[nomeEtapa] || { atual: 1, total: 6 };
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
          servico.status,
          servico.etapa,
        ]
          .join(" ")
          .toLowerCase()
          .includes(termoBusca),
      );
    }

    return servicosFiltrados;
  }

  getEtapasDisponiveis() {
    return [
      "Aguardando orçamento",
      "Orçamento aprovado",
      "Aguardando peças",
      "Execução em andamento",
      "Aguardando aprovação",
      "Concluído",
    ];
  }

  getStatusDisponiveis() {
    return ["Ativo", "Finalizado", "Cancelado"];
  }
}

export default new ServicosService();
