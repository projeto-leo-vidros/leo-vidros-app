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
      setError(error.response?.data?.message || "Email ou senha inv\u00e1lidos");
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
          <div className="mx-auto flex h-full w-full max-w-[372px] flex-col">
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={Logo} alt="Logo" className="h-12 w-auto" />
              <div className="mt-2 flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-[#111827]">
                  Entre na sua conta
                </h1>
                <p className="text-sm text-[#6b7280]">
                  {"Fa\u00e7a login para continuar"}
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="mt-10 flex flex-1 flex-col gap-6">
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
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <div className="-mt-1 flex justify-end">
                <button
                  type="button"
                  className="cursor-pointer text-sm font-medium text-[#007EA7] transition hover:text-[#005f73]"
                  onClick={() => navigate("/esqueceu-senha")}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#007EA7] to-[#005f73] py-4 font-semibold text-white shadow-md transition-all hover:from-[#006d93] hover:to-[#004d5e]"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>

            <div className="mt-8 flex flex-col gap-5 pb-1">
              <div className="flex items-center gap-3">
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
