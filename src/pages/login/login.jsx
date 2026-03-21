import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Lock } from "lucide-react";
import Button from "../../components/ui/Button/Button.component";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import { useNavigate } from "react-router-dom";
import Api from "../../api/client/Api";
import { useUser } from "../../context/UserContext";

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

      // Popula o UserContext (que persiste no sessionStorage internamente)
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
          className="hidden lg:flex flex-1 h-[600px] rounded-xl bg-cover bg-center shadow-lg/20"
          style={{
            backgroundImage:
              'url("src/assets/images/GlazierAdobeStock_576236137.jpeg")',
          }}
        />

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md backdrop-blur-sm p-8 rounded-xl relative"
        >
          <div className="flex flex-col gap-6">
            <div className="mb-10 text-center flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-[#111827] mb-2">
                Entre na sua conta
              </h1>
              <p className="text-[#6b7280] text-sm">
                Faça login para continuar
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
                    startIcon={<UserCircle size={30} />}
                  />

                  {/* Senha */}
                  <UniversalInput
                    variant="underline"
                    label="Senha"
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    startIcon={<Lock size={30} />}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Mensagem de erro */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Esqueceu senha */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-[#007EA7] hover:text-[#005f73] transition cursor-pointer"
                  onClick={() => navigate("/esqueceu-senha")}
                >
                  Esqueceu sua senha?
                </button>
              </div>

              {/* Botão */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-full bg-[#007EA7] hover:bg-[#005f73] text-white font-medium py-4 rounded-lg transition-colors cursor-pointer"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>


            {/* Cadastro link */}
            <div className="text-center">
              <p className="text-sm text-[#6b7280]">
                Ainda não tem uma conta?{" "}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/Cadastro")}
                  className="text-[#007EA7] hover:text-[#005f73] font-medium transition-colors cursor-pointer"
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
