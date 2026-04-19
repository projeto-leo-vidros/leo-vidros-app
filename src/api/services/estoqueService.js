import { Api, EtlApi } from "../client/Api";
import BaseService from '../client/BaseService';

class EstoqueService extends BaseService {
  constructor() {
    super(Api);
  }

  getAll({ page = 0, size = 20 } = {}) {
    return this.get("/estoques", { params: { page, size } });
  }

  
  getById(id) {
    return this.get(`/estoques/${id}`);
  }


  getLowStock() {
    return this.get("/estoques/baixo");
  }


  getCriticalItems() {
    return this.get("/estoques/criticos");
  }

 
  registrarEntrada(data) {
    return this.post("/estoques/entrada", data);
  }

 
  registrarSaida(data) {
    return this.post("/estoques/saida", data);
  }


  getHistorico(produtoId, { page = 0, size = 20 } = {}) {
    return this.get(`/estoques/${produtoId}/historico`, { params: { page, size } });
  }


  getByCategoria(categoria) {
    return this.get("/estoques", { params: { categoria } });
  }

  update(id, data) {
    return this.put(`/estoques/${id}`, data);
  }


  delete(id) {
    return this.delete(`/estoques/${id}`);
  }

  importarPlanilha(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    return this.post("/estoques/importar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }


  async exportToExcel() {
    try {
      const response = await EtlApi.get(`/export/estoque`, {
        responseType: 'blob',
        withCredentials: true, 
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      console.error("Erro ao exportar planilha de estoque:", error);
      return {
        success: false,
        data: null,
        error:
          error.response?.data?.message ??
          error.message ??
          "Erro ao exportar planilha",
        status: error.response?.status,
      };
    }
  }
}

export const estoqueService = new EstoqueService();
export default estoqueService;
