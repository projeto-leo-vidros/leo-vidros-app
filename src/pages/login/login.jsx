import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Lock } from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import { useNavigate } from "react-router-dom";
import Api from "../../api/client/Api";
import { useUser } from "../../context/UserContext";
import Logo from "../../assets/logo-sidebar.png";
import BgImage from "../../assets/GlazierAdobeStock_576236137.jpeg";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await Api.post(
        "/auth/login",
        { email, senha },
        { skipAuthRedirect: true },
      );
      const data = response.data;
      const { id, firstLogin, nome, email: userEmail } = data;
      login({ id, nome, email: userEmail, firstLogin });
      setModalOpen(true);
      setTimeout(() => {
        setModalOpen(false);
        if (data.firstLogin === true || data.firstLogin === "true") {
          navigate(`/primeiroAcesso/${data.id}`);
        } else {
          navigate("/pagina-inicial");
        }
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Email ou senha inválidos");
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
      <div className="w-full max-w-6xl flex items-center justify-center gap-6 lg:gap-12">
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
          className="w-full max-w-md bg-white border border-gray-100 shadow-xl px-6 py-8 sm:px-10 sm:py-10 rounded-2xl"
        >
          <div className="flex flex-col gap-8">
            <div className="text-center flex flex-col items-center gap-3">
              <img src={Logo} alt="Logo" className="h-12 w-auto" />
              <div className="flex flex-col gap-1 mt-2">
                <h1 className="text-3xl font-bold text-[#111827]">
                  Entre na sua conta
                </h1>
                <p className="text-[#6b7280] text-sm">
                  Faça login para continuar
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key="login"
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-6"
                >
                  <UniversalInput
                    variant="underline"
                    label="Email"
                    id="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    startIcon={<UserCircle size={20} />}
                  />
                  <UniversalInput
                    variant="underline"
                    label="Senha"
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    startIcon={<Lock size={20} />}
                  />
                </motion.div>
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[#007EA7] hover:text-[#005f73] transition font-medium cursor-pointer"
                  onClick={() => navigate("/esqueceu-senha")}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#007EA7] to-[#005f73] hover:from-[#006d93] hover:to-[#004d5e] text-white font-semibold py-4 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {loading ? "Entrando..." : "Entrar"}
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
        title="Login realizado com sucesso!"
        description="Redirecionando..."
        duration={2000}
      />
    </div>
  );
}

export default Login;
