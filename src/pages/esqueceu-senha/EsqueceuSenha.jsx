import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import { useNavigate } from "react-router-dom";
import Api from "../../api/client/Api";
import Swal from "sweetalert2";
import Logo from "../../assets/logo-sidebar.png";
import BgImage from "../../assets/GlaserAdobeStock_741312364.jpeg";

const EsqueceuSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await Api.post("/auth/forgot-password", { email });
      if (response.status === 200) {
        setModalOpen(true);
        setTimeout(() => {
          setModalOpen(false);
          Swal.fire({
            icon: "success",
            title: "Senha tempor\u00e1ria enviada!",
            text: "Verifique seu email e use a senha tempor\u00e1ria para fazer login.",
            timer: 3000,
            showConfirmButton: false,
          });
          setTimeout(() => navigate("/login"), 3500);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
      if (error.response?.status === 404) {
        Swal.fire({
          icon: "error",
          title: "Email n\u00e3o encontrado",
          text: "O email informado n\u00e3o est\u00e1 cadastrado no sistema.",
          confirmButtonColor: "#007EA7",
        });
      } else if (error.response?.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Email inv\u00e1lido",
          text: "Por favor, digite um email v\u00e1lido.",
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-t from-[#dff0f5] via-[#edf6f9] to-white p-4 sm:p-6">
      <div className="w-full max-w-6xl flex items-center justify-center gap-6 lg:items-stretch lg:gap-12">
        <div className="hidden lg:flex flex-1 h-[620px] rounded-2xl overflow-hidden shadow-2xl relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#003d5b]/70 via-[#007EA7]/20 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10 lg:h-[620px]"
        >
          <div className="mx-auto flex h-full w-full max-w-[366px] flex-col justify-center gap-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <img src={Logo} alt="Logo" className="h-12 w-auto" />
              <div className="mt-2 flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-[#111827]">Esqueceu sua senha?</h1>
                <p className="text-sm text-[#6b7280]">
                  {"Digite seu e-mail e enviaremos uma senha tempor\u00e1ria"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="forgot-password"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                >
                  <UniversalInput
                    variant="underline"
                    label="E-mail"
                    id="email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    startIcon={<Mail size={20} />}
                    required
                    disabled={loading}
                  />
                </motion.div>
              </AnimatePresence>

              <div className="mt-2 flex w-full flex-col-reverse items-center gap-3 pt-2 sm:flex-row">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || !email.trim()}
                  className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-[#007EA7] to-[#005f73] py-4 font-semibold text-white shadow-md transition-all hover:from-[#006d93] hover:to-[#004d5e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Verificando..." : "Enviar email"}
                </Button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#6b7280] shadow-sm transition-all hover:border-gray-300"
                >
                  <ArrowLeft size={15} />
                  Voltar para login
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400">ou</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <p className="text-center text-sm text-[#6b7280]">
              {"Ainda n\u00e3o tem uma conta? "}
              <button
                type="button"
                onClick={() => navigate("/cadastro")}
                className="cursor-pointer font-semibold text-[#007EA7] transition-colors hover:text-[#005f73]"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      <FeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type="success"
        title="Email verificado!"
        description={"Senha tempor\u00e1ria sendo enviada para seu e-mail. Redirecionando para o login..."}
        duration={2000}
      />
    </div>
  );
};

export default EsqueceuSenha;
