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
   * Atualiza os dados de um orçamento existente (rascunho).
   * @param {number|string} id
   * @param {object} dados - Payload no formato OrcamentoRequestDto
   */
  async atualizarOrcamento(id, dados) {
    const result = await this._handle(this.api.put(`/orcamentos/${id}`, dados));
    if (!result.success) result.validationErrors = {};
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
   * 🎯 MELHORADO: Faz download do PDF com retry e status check
   * Busca o PDF que foi gerado pelo microserviço e armazenado em cache.
   * @param {number|string} id - ID do orçamento
   * @param {string} [numeroOrcamento] - Número do orçamento (para buscar do cache)
   */
  async baixarPdf(id, numeroOrcamento) {
    try {
      // Se temos o número do orçamento, tenta primeiro o novo endpoint de cache
      if (numeroOrcamento) {
        try {
          const response = await this.api.get(
            `/orcamentos/numero/${numeroOrcamento}/pdf`,
            {
              responseType: "blob",
            }
          );
          return {
            success: true,
            data: response.data,
            status: response.status,
          };
        } catch (cacheError) {
            `⚠️  PDF não está disponível via número ${numeroOrcamento}, tentando por ID...`,
            cacheError.response?.status
          );
          // Se falhar, tenta o endpoint antigo
        }
      }

      // Fallback: tenta o endpoint antigo por ID
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
   * 🎯 NOVO: Verificar status do PDF antes de baixar
   * Faz polling do status até que o PDF esteja pronto ou timeout
   * @param {string} numeroOrcamento - Número do orçamento
   * @param {number} maxTentativas - Número máximo de tentativas (default: 30)
   * @param {number} intervalo - Intervalo em ms entre tentativas (default: 1000)
   */
  async verificarStatusPdf(numeroOrcamento, maxTentativas = 30, intervalo = 1000) {
    let tentativa = 0;
    
    while (tentativa < maxTentativas) {
      try {
        const response = await this.api.get(
          `/orcamentos/${numeroOrcamento}/status`
        );
        
        if (response.data && response.data.pronto) {
          return {
            success: true,
            pronto: true,
            tamanho: response.data.tamanho,
            mensagem: response.data.mensagem,
          };
        }
        
        tentativa++;
        if (tentativa < maxTentativas) {
            `⏳ PDF não pronto ainda... tentativa ${tentativa}/${maxTentativas}`
          );
          await new Promise((resolve) => setTimeout(resolve, intervalo));
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }
    
    // Timeout
    return {
      success: false,
      pronto: false,
      error: `PDF não foi gerado em ${(maxTentativas * intervalo) / 1000}s`,
    };
  }

  /**
   * Cria uma conexão SSE para acompanhar o progresso da geração do orçamento.
   *
   * @param {string|number} orcamentoId - ID do orçamento para monitorar
   * @param {function} onProgress - Callback chamado a cada evento de progresso
   *   Recebe: { id: string, status: 'GERANDO_ORCAMENTO' | 'GERANDO_PDF' | 'FINALIZADO' | 'ERRO' }
   * @returns {{ close: function }} Objeto com método close() para encerrar a conexão
   */
  /**
   * 🎯 MELHORADO: Conecta ao stream SSE usando fetch com headers seguros
   * Isso é mais seguro que EventSource pois o token vai no header, não na URL
   * @param {string|number} orcamentoId - ID do orçamento para monitorar
   * @param {function} onProgress - Callback chamado a cada evento de progresso
   * @returns {{ close: function, promise: Promise }} Objeto com método close() e promise de conclusão
   */
  monitorarProgresso(orcamentoId, onProgress) {
    const baseURL = this.api.defaults.baseURL;
    const url = `${baseURL}/orcamentos/stream/${orcamentoId}`;
    
    
    // Obter token do storage
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    // Controller para cancelar o request quando necessário
    const abortController = new AbortController();
    
    // Promise que se resolve quando a stream acaba
    const streamPromise = fetch(url, {
      method: "GET",
      headers: {
        "Accept": "text/event-stream",
        ...(token && { "Authorization": `Bearer ${token}` }),
      },
      credentials: "include", // Inclui cookies httpOnly
      signal: abortController.signal,
    })
      .then(async (response) => {
          contentType: response.headers.get("content-type"),
          cacheControl: response.headers.get("cache-control"),
          transferEncoding: response.headers.get("transfer-encoding"),
        });
        
        if (!response.ok) {
          throw new Error(`SSE request failed: ${response.status}`);
        }
        
        
        // Ler a stream usando ReadableStream API
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let eventCount = 0;
        let currentEvent = {}; // Para armazenar dados de múltiplas linhas
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            // Decodificar o chunk e adicionar ao buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Processar eventos completos (separados por \n\n)
            const events = buffer.split("\n\n");
            buffer = events.pop() || ""; // Último item pode estar incompleto
            
            for (const event of events) {
              if (!event.trim()) continue; // Ignorar eventos vazios
              
              
              const lines = event.split("\n");
              let eventName = "";
              let eventData = null;
              
              // Parse das linhas do evento
              for (const line of lines) {
                if (line.startsWith("event:") || line.startsWith("event: ")) {
                  // Tira "event:" ou "event: " e pega o resto
                  eventName = line.substring(line.indexOf(":") + 1).trim();
                } else if (line.startsWith("data:") || line.startsWith("data: ")) {
                  try {
                    // Tira "data:" ou "data: " e pega o resto
                    const dataStr = line.substring(line.indexOf(":") + 1).trim();
                    eventData = JSON.parse(dataStr);
                  } catch (e) {
                  }
                }
              }
              
              // Se conseguiu extrair dados, dispara callback
              if (eventData) {
                eventCount++;
                onProgress(eventData);
              }
            }
          }
        } catch (error) {
          if (error.name !== "AbortError") {
          }
        } finally {
          reader.releaseLock();
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
        }
      });
    
    return {
      close: () => {
        abortController.abort();
      },
      promise: streamPromise,
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
