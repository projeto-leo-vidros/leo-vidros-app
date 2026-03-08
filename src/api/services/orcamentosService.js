import Api from "../client/Api";
import BaseService from "../client/BaseService";

/**
 * Service de Orçamentos — estende BaseService.
 *
 * Fornece:
 *  - CRUD de orçamentos
 *  - Publicação para geração assíncrona de PDF via RabbitMQ
 *  - Stream SSE para acompanhar progresso
 *  - Download de PDF
 */
class OrcamentosService extends BaseService {
  constructor() {
    super(Api);
  }

  /**
   * Cria um novo orçamento e dispara a geração assíncrona do PDF.
   * @param {object} dados - Payload no formato OrcamentoRequestDto
   */
  async criarOrcamento(dados) {
    const result = await this.post("/orcamentos", dados);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  /** Retorna todos os orçamentos ativos. */
  async buscarTodos() {
    const result = await this.get("/orcamentos");
    if (result.success) result.data = result.data || [];
    return result;
  }

  /**
   * Retorna um orçamento pelo ID.
   * @param {number|string} id
   */
  buscarPorId(id) {
    return this.get(`/orcamentos/${id}`);
  }

  /**
   * Retorna orçamentos de um pedido.
   * @param {number|string} pedidoId
   */
  async buscarPorPedido(pedidoId) {
    const result = await this.get(`/orcamentos/pedido/${pedidoId}`);
    if (result.success) result.data = result.data || [];
    return result;
  }

  /**
   * Atualiza o status de um orçamento.
   * @param {number|string} id
   * @param {string} status
   * @param {string} [pdfPath]
   */
  atualizarStatus(id, status, pdfPath) {
    const body = { status };
    if (pdfPath) body.pdfPath = pdfPath;
    return this._handle(this.api.patch(`/orcamentos/${id}/status`, body));
  }

  /**
   * Retorna a URL de download do PDF.
   * @param {number|string} id
   */
  getUrlDownloadPdf(id) {
    const baseURL = this.api.defaults.baseURL;
    return `${baseURL}/orcamentos/${id}/pdf`;
  }

  /**
   * Faz download do PDF do orçamento.
   * @param {number|string} id
   */
  async baixarPdf(id) {
    try {
      const response = await this.api.get(`/orcamentos/${id}/pdf`, {
        responseType: "blob",
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ??
          error.message ??
          "Erro ao baixar PDF",
        status: error.response?.status,
      };
    }
  }

  /**
   * Cria uma conexão SSE para acompanhar o progresso da geração do orçamento.
   *
   * @param {string|number} orcamentoId - ID do orçamento para monitorar
   * @param {function} onProgress - Callback chamado a cada evento de progresso
   *   Recebe: { id: string, status: 'GERANDO_ORCAMENTO' | 'GERANDO_PDF' | 'FINALIZADO' | 'ERRO' }
   * @returns {{ close: function }} Objeto com método close() para encerrar a conexão
   */
  monitorarProgresso(orcamentoId, onProgress) {
    const baseURL = this.api.defaults.baseURL;
    const url = `${baseURL}/orcamentos/stream/${orcamentoId}`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("orcamento-progress", (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);
      } catch (e) {
        console.error("Erro ao parsear evento SSE:", e);
      }
    });

    eventSource.onerror = (error) => {
      console.warn("Erro na conexão SSE:", error);
      // Não fecha automaticamente; SSE reconecta por padrão.
      // O componente de UI decide se quer fechar.
    };

    return {
      close: () => {
        eventSource.close();
      },
    };
  }

  /**
   * Converte os dados do formulário de orçamento para o formato esperado pela API.
   * @param {object} dadosGerais - Dados gerais do formulário
   * @param {array} itens - Lista de itens do orçamento
   * @param {number} subtotalGeral - Subtotal calculado
   * @param {number} descontoGeral - Desconto geral
   * @param {number} totalFinal - Total final calculado
   */
  mapearParaBackend(dadosGerais, itens, subtotalGeral, descontoGeral, totalFinal) {
    return {
      pedidoId: parseInt(dadosGerais.pedido_id, 10),
      clienteId: dadosGerais.cliente_id ? parseInt(dadosGerais.cliente_id, 10) : null,
      statusNome: dadosGerais.status_id || "RASCUNHO",
      numeroOrcamento: dadosGerais.numero_orcamento,
      dataOrcamento: dadosGerais.data_orcamento,
      observacoes: dadosGerais.observacoes || null,
      prazoInstalacao: dadosGerais.prazo_instalacao || null,
      garantia: dadosGerais.garantia || null,
      formaPagamento: dadosGerais.forma_pagamento || null,
      valorSubtotal: subtotalGeral,
      valorDesconto: parseFloat(descontoGeral) || 0,
      valorTotal: totalFinal,
      itens: itens.map((item, index) => ({
        produtoId: item.produto_id ? parseInt(item.produto_id, 10) : null,
        descricao: item.descricao,
        quantidade: parseFloat(item.quantidade) || 0,
        precoUnitario: parseFloat(item.preco_unitario) || 0,
        desconto: parseFloat(item.desconto) || 0,
        observacao: item.observacao || null,
        ordem: index + 1,
      })),
    };
  }
}

export default new OrcamentosService();
