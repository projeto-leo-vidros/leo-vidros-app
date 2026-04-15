import Api from "../client/Api";
import BaseService from "../client/BaseService";

class AgendamentosService extends BaseService {
  constructor() {
    super(Api);
  }

  getAll() {
    return this.get("/agendamentos");
  }

  getById(id) {
    return this.get(`/agendamentos/${id}`);
  }

  create(agendamento) {
    return this.post("/agendamentos", agendamento);
  }

  update(id, agendamento) {
    return this.put(`/agendamentos/dados-basicos/${id}`, agendamento);
  }

  delete(id) {
    return super.delete(`/agendamentos/${id}`);
  }
}

export const agendamentosService = new AgendamentosService();
export default agendamentosService;
