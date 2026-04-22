import axios from "axios";
import Swal from "sweetalert2";
import { repairEncoding } from "../../utils/fixEncoding";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;
const ETL_URL =
  import.meta.env.VITE_MICROSERVICE_ETL_URL;

const configureInterceptors = (instance) => {
  instance.interceptors.request.use((config) => {
    if (config.method === "post" || config.method === "put") {
      if (!config.headers["Content-Type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }
    // Token é enviado automaticamente via cookie com withCredentials: true
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      const responseType = response.config?.responseType;

      if (responseType !== "blob" && responseType !== "arraybuffer") {
        response.data = repairEncoding(response.data);
      }

      return response;
    },
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

        // Limpar apenas dados do usuário, não tokens (removidos dos cookies pelo servidor)
        sessionStorage.clear();

        setTimeout(() => (window.location.href = "/login"), 2500);
      }

      return Promise.reject(error);
    },
  );
};

const Api = axios.create({ baseURL: BACKEND_URL, withCredentials: true });
const EtlApi = axios.create({ baseURL: ETL_URL, withCredentials: true });

configureInterceptors(Api);
configureInterceptors(EtlApi);

export { EtlApi };
export default Api;
