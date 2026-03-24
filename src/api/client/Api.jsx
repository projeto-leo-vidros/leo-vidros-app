import axios from "axios";
import Swal from "sweetalert2";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;
const ETL_URL =
  import.meta.env.VITE_MICROSERVICE_ETL_URL;

// Função para configurar interceptors em qualquer instância (reaproveitamento de código)
const configureInterceptors = (instance) => {
  instance.interceptors.request.use((config) => {
    if (config.method === "post" || config.method === "put") {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }
    
    // 🎯 NOVO: Adicionar token JWT ao header Authorization se estiver em localStorage ou sessionStorage
    // Isso garante que o token seja enviado mesmo que o cookie httpOnly não seja enviado
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${token}`;
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

        setTimeout(() => (window.location.href = "/Login"), 2500);
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
