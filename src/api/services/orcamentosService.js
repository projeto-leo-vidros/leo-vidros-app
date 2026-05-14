import Api from "../client/Api";
import BaseService from "../client/BaseService";


class OrcamentosService extends BaseService {
  constructor() {
    super(Api);
  }

  async criarOrcamento(dados) {
    const result = await this.post("/orcamentos", dados);
    if (!result.success) result.validationErrors = {};
    return result;
  }

  async buscarTodos() {
    const result = await this.get("/orcamentos");
    if (result.success) {
      const raw = result.data;
      result.data = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
    }
    return result;
  }

  async gerarPdf(id) {
    const result = await this._handle(this.api.post(`/orcamentos/${id}/gerar-pdf`));
    return result;
  }

  buscarPorId(id) {
    return this.get(`/orcamentos/${id}`);
  }

  async buscarPorPedido(pedidoId) {
    const result = await this.get(`/orcamentos/pedido/${pedidoId}`);
    if (result.success) {
      const raw = result.data;
      result.data = Array.isArray(raw) ? raw : (Array.isArray(raw?.content) ? raw.content : []);
    }
    return result;
  }

  async atualizarOrcamento(id, dados) {
    const result = await this._handle(this.api.patch(`/orcamentos/${id}`, dados));
    if (!result.success) result.validationErrors = {};
    return result;
  }

  atualizarStatus(id, status, pdfPath) {
    const body = { status };
    if (pdfPath) body.pdfPath = pdfPath;
    return this._handle(this.api.patch(`/orcamentos/${id}/status`, body));
  }

  getUrlDownloadPdf(id) {
    const baseURL = this.api.defaults.baseURL;
    return `${baseURL}/orcamentos/${id}/pdf`;
  }

  async baixarPdf(id, numeroOrcamento) {
    try {
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
          console.warn(
            `PDF não está disponível via número ${numeroOrcamento}, tentando por ID...`,
            cacheError.response?.status
          );
        }
      }

      const response = await this.api.get(`/orcamentos/id/${id}/pdf`, {
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
          console.log(
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
    
    return {
      success: false,
      pronto: false,
      error: `PDF não foi gerado em ${(maxTentativas * intervalo) / 1000}s`,
    };
  }

  monitorarProgresso(orcamentoId, onProgress) {
    const baseURL = this.api.defaults.baseURL;
    const url = `${baseURL}/orcamentos/stream/${orcamentoId}`;

    const abortController = new AbortController();

    const streamPromise = fetch(url, {
      method: "GET",
      headers: { "Accept": "text/event-stream" },
      credentials: "include",
      signal: abortController.signal,
    })
      .then(async (response) => {
        console.log({
          contentType: response.headers.get("content-type"),
          cacheControl: response.headers.get("cache-control"),
          transferEncoding: response.headers.get("transfer-encoding"),
        });
        
        if (!response.ok) {
          throw new Error(`SSE request failed: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            const events = buffer.split("\n\n");
            buffer = events.pop() || "";
            
            for (const event of events) {
              if (!event.trim()) continue; 
              const lines = event.split("\n");
              let eventData = null;
              
              for (const line of lines) {
                if (line.startsWith("data:") || line.startsWith("data: ")) {
                  try {
                    const dataStr = line.substring(line.indexOf(":") + 1).trim();
                    eventData = JSON.parse(dataStr);
                  } catch {
                    eventData = null;
                  }
                }
              }

              if (eventData) {
                onProgress(eventData);
              }
            }
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("SSE stream error:", error);
          }
        } finally {
          reader.releaseLock();
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("SSE connection error:", error);
        }
      });
    
    return {
      close: () => {
        abortController.abort();
      },
      promise: streamPromise,
    };
  }

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
