import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import { useNavigate } from "react-router-dom";
import Api from "../../api/client/Api";
import Swal from "sweetalert2";

const EsqueceuSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o email existe e enviar senha temporária
      const response = await Api.post("/auth/forgot-password", { email });

      if (response.status === 200) {
        // Email encontrado e senha temporária enviada
        setModalOpen(true);

        // Fechar modal e voltar para login após 3 segundos
        setTimeout(() => {
          setModalOpen(false);
          Swal.fire({
            icon: "success",
            title: "Senha temporária enviada!",
            text: "Verifique seu email e use a senha temporária para fazer login.",
            timer: 3000,
            showConfirmButton: false,
          });

          setTimeout(() => {
            navigate("/Login");
          }, 3500);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);

      // Tratamento de diferentes tipos de erro
      if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Email não encontrado",
          text: "O email informado não está cadastrado no sistema.",
          confirmButtonColor: "#007EA7",
        });
      } else if (error.response?.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Email inválido",
          text: "Por favor, digite um email válido.",
          confirmButtonColor: "#007EA7",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no servidor",
          text: "Ocorreu um erro interno. Tente novamente mais tarde.",
          confirmButtonColor: "#007EA7",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7f9fa] p-4">
      <div className="absolute top-5 right-10">
        <img
          src="/src/assets/logo/logo-sidebar.png"
          alt="Logo"
          className="h-12 w-auto"
        />
      </div>
      <div className="w-full max-w-6xl flex items-center justify-center gap-12">
        {/* Imagem lateral */}
        <div
          className="hidden lg:flex flex-1 h-[600px] rounded-xl bg-cover bg-center shadow-lg"
          style={{
            backgroundImage:
              'url("/src/assets/images/GlaserAdobeStock_741312364.jpeg")',
          }}
        />

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md backdrop-blur-sm p-8 rounded-xl"
        >
          <div className="flex flex-col gap-6">
            {/* Botão voltar */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => navigate("/Login")}
                className="flex items-center gap-2 text-[#007EA7] hover:text-[#005f73] transition-colors"
              >
                <ArrowLeft size={20} className="cursor-pointer" />
                <span className="text-md font-semibold cursor-pointer">
                  Voltar ao login
                </span>
              </button>
            </div>

            <div className="mb-6 text-center flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-[#111827] mb-2">
                Esqueceu sua senha?
              </h1>
              <p className="text-[#6b7280] text-sm">
                Digite seu e-mail e enviaremos uma senha temporária
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="forgot-password"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="space-y-3">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[#6b7280] text-left"
                    >
                      E-mail
                    </label>
                    <div className="flex items-center gap-3 border-b-2 border-[#8a8e97] bg-transparent focus-within:border-[#007EA7] transition-all py-3">
                      <Mail size={30} className="text-[#6b7280]" />
                      <input
                        id="email"
                        type="email"
                        placeholder="Digite seu e-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-transparent text-[#111827] placeholder-[#9ca3af] focus:outline-none text-lg py-3"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Botão */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || !email.trim()}
                  className="w-full bg-[#007EA7] hover:bg-[#005f73] text-white font-medium py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Verificando..." : "Enviar senha temporária"}
                </Button>
              </div>
            </form>

            {/* Divisor */}
            <div className="my-6">
              <div className="h-px bg-black w-full" />
            </div>

            {/* Link para cadastro */}
            <div className="text-center">
              <p className="text-sm text-[#6b7280]">
                Ainda não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/Cadastro")}
                  className="text-[#007EA7] hover:text-[#005f73] font-medium transition-colors cursor-pointer"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de sucesso */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#111827] text-center">
                  Email verificado!
                </h2>
                <p className="text-[#6b7280] text-center">
                  Senha temporária sendo enviada para seu e-mail...
                </p>
                <p className="text-sm text-[#6b7280] text-center">
                  Redirecionando para o login...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EsqueceuSenha;
