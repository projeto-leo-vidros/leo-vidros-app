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
            title: "Senha temporária enviada!",
            text: "Verifique seu email e use a senha temporária para fazer login.",
            timer: 3000,
            showConfirmButton: false,
          });
          setTimeout(() => navigate("/login"), 3500);
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
      if (error.response?.status === 404) {
        Swal.fire({ icon: "error", title: "Email não encontrado", text: "O email informado não está cadastrado no sistema.", confirmButtonColor: "#007EA7" });
      } else if (error.response?.status === 400) {
        Swal.fire({ icon: "error", title: "Email inválido", text: "Por favor, digite um email válido.", confirmButtonColor: "#007EA7" });
      } else {
        Swal.fire({ icon: "error", title: "Erro no servidor", text: "Ocorreu um erro interno. Tente novamente mais tarde.", confirmButtonColor: "#007EA7" });
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-t from-[#dff0f5] via-[#edf6f9] to-white p-4">
      <div className="w-full max-w-6xl flex items-center justify-center gap-12">
        {/* Imagem lateral com overlay */}
        <div className="hidden lg:flex flex-1 h-[620px] rounded-2xl overflow-hidden shadow-2xl relative">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BgImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#003d5b]/70 via-[#007EA7]/20 to-transparent" />
        </div>

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white border border-gray-100 shadow-xl px-10 py-10 rounded-2xl"
        >
          <div className="flex flex-col gap-8">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-[#007EA7] hover:text-[#005f73] transition-colors w-fit cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-semibold">Voltar ao login</span>
            </button>

            <div className="text-center flex flex-col items-center gap-3">
              <img src={Logo} alt="Logo" className="h-12 w-auto" />
              <div className="flex flex-col gap-1 mt-2">
                <h1 className="text-3xl font-bold text-[#111827]">Esqueceu sua senha?</h1>
                <p className="text-[#6b7280] text-sm">
                  Digite seu e-mail e enviaremos uma senha temporária
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

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading || !email.trim()}
                  className="w-full bg-gradient-to-r from-[#007EA7] to-[#005f73] hover:from-[#006d93] hover:to-[#004d5e] text-white font-semibold py-4 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Verificando..." : "Enviar senha temporária"}
                </Button>
              </div>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400 font-medium">ou</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <p className="text-sm text-[#6b7280] text-center">
              Ainda não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/cadastro")}
                className="text-[#007EA7] hover:text-[#005f73] font-semibold transition-colors cursor-pointer"
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
        description="Senha temporária sendo enviada para seu e-mail. Redirecionando para o login..."
        duration={2000}
      />
    </div>
  );
};

export default EsqueceuSenha;
