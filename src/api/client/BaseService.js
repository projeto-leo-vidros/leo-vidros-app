import { getErroAmigavel } from "../../utils/errors";

class BaseService {
  constructor(api) {
    this.api = api;
  }

  async _handle(promise) {
    try {
      const response = await promise;
      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;
      const rawError = backendMessage ?? error.message ?? "Erro na requisição";
      return {
        success: false,
        data: null,
        error: getErroAmigavel({ message: rawError, status }),
        status,
      };
    }
  }

  get(url, config) {
    return this._handle(this.api.get(url, config));
  }

  post(url, data, config) {
    return this._handle(this.api.post(url, data, config));
  }

  put(url, data, config) {
    return this._handle(this.api.put(url, data, config));
  }

  delete(url, config) {
    return this._handle(this.api.delete(url, config));
  }
}

export default BaseService;
