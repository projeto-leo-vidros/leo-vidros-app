import Api, { EtlApi } from "../client/Api";
import BaseService from "../client/BaseService";

class ClientesService extends BaseService {
  constructor() {
    super(Api);
  }

  getAll({ page = 0, size = 20 } = {}) {
    return this.get("/clientes", { params: { page, size } });
  }

  getById(id) {
    return this.get(`/clientes/${id}`);
  }

  create(cliente) {
    return this.post("/clientes", cliente);
  }

  update(id, cliente) {
    return this.put(`/clientes/${id}`, cliente);
  }

  delete(id) {
    return super.delete(`/clientes/${id}`);
  }


  importarPlanilha(arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);

    return this._handle(
      EtlApi.post("/excel/import/clientes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  }
}

export const clientesService = new ClientesService();
export default clientesService;
