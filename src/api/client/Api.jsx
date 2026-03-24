import axios from "axios";
import Swal from "sweetalert2";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3000/api";
const ETL_URL =
  import.meta.env.VITE_MICROSERVICE_ETL_URL || "http://localhost:3001/api";

// Função para configurar interceptors em qualquer instância (reaproveitamento de código)
const configureInterceptors = (instance) => {
  instance.interceptors.request.use((config) => {
    if (config.method === "post" || config.method === "put") {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const skipRedirect = error.config?.skipAuthRedirect;

      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !skipRedirect
      ) {
        const message =
          error.response?.status === 403
            ? "Acesso negado. Faça login novamente."
            : "Sessão expirada. Faça login novamente.";

        Swal.fire({
          icon: "error",
          text: message,
          timer: 2500,
          showConfirmButton: false,
        });

        sessionStorage.clear();
        localStorage.clear();

        setTimeout(() => (window.location.href = "/login"), 2500);
      }

      return Promise.reject(error);
    },
  );
};

// Criação das instâncias
const Api = axios.create({ baseURL: BACKEND_URL, withCredentials: true });
const EtlApi = axios.create({ baseURL: ETL_URL, withCredentials: true });

// Aplica a configuração de interceptors em ambas as instâncias
configureInterceptors(Api);
configureInterceptors(EtlApi);

export { EtlApi };
export default Api;
