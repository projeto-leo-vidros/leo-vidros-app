import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import Button from "../../components/ui/Button/Button.component";
import Api from "../../api/client/Api";
import Logo from "../../assets/logo-sidebar.png";

const PasswordRequirement = ({ text, isValid }) => (
  <div className={`flex items-center gap-2 text-sm transition-colors duration-200 ${isValid ? "text-green-600" : "text-gray-400"}`}>
    {isValid
      ? <Check className="w-4 h-4 text-green-500 shrink-0" />
      : <X className="w-4 h-4 text-gray-300 shrink-0" />
    }
    <span>{text}</span>
  </div>
);

export default function NovaSenha() {
  const { idUsuario } = useParams();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userName, setUserName] = useState("Usuário");
  const navigate = useNavigate();

  useEffect(() => {
    const loggedUserName = sessionStorage.getItem("nome");
    if (loggedUserName) setUserName(loggedUserName);
  }, [idUsuario]);

  const is8Chars = novaSenha.length >= 8;
  const isUppercase = /[A-Z]/.test(novaSenha);
  const isNumber = /[0-9]/.test(novaSenha);
  const passwordsMatch = novaSenha === confirmaSenha && novaSenha.length > 0;
  const isFormValid = is8Chars && isUppercase && isNumber && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!isFormValid) {
      setError("Verifique se todos os requisitos de senha foram atendidos e se as senhas coincidem.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await Api.put("/usuarios/definir-senha", {
        idUsuario: parseInt(idUsuario),
        novaSenha,
      });
      if (response.status === 200 || response.status === 204) {
        setSuccess("Senha definida com sucesso! Redirecionando...");
        localStorage.setItem("firstLogin", "false");
        setTimeout(() => navigate("/pagina-inicial"), 1500);
      } else {
        setError(response.data?.message || "Erro ao definir a senha. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro na API:", err);
      setError(err.response?.data?.message || "Falha na comunicação com o servidor. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-[#dff0f5] via-[#edf6f9] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-gray-100 shadow-xl rounded-2xl px-10 py-10 w-full max-w-md"
      >
        <div className="flex flex-col items-center text-center">
          <img src={Logo} alt="Logo Léo Vidros" className="h-12 w-auto mb-6" />

          <div className="flex flex-col gap-1 mb-8">
            <p className="text-gray-400 text-sm">Seja bem-vindo,</p>
            <h1 className="text-3xl font-bold text-gray-800">{userName}</h1>
            <p className="text-gray-400 text-sm mt-2">
              Defina sua senha para começar a usar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            <div className="text-left">
              <UniversalInput
                label="Nova senha:"
                type="password"
                id="novaSenha"
                placeholder="********"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                startIcon={<Lock size={20} />}
              />
            </div>

            <div className="text-left">
              <UniversalInput
                label="Digite a senha novamente:"
                type="password"
                id="confirmaSenha"
                placeholder="********"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
                error={confirmaSenha.length > 0 && !passwordsMatch ? "As senhas não coincidem" : null}
                startIcon={<Lock size={20} />}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2 text-left">
              <PasswordRequirement text="Pelo menos 8 caracteres" isValid={is8Chars} />
              <PasswordRequirement text="Pelo menos 1 letra maiúscula" isValid={isUppercase} />
              <PasswordRequirement text="Pelo menos 1 número" isValid={isNumber} />
              <PasswordRequirement text="As senhas coincidem" isValid={passwordsMatch} />
            </div>

            {success && (
              <p className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-200 text-center">
                {success}
              </p>
            )}
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-200 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!isFormValid || isLoading}
              className="w-full py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-[#007EA7] to-[#005f73] hover:from-[#006d93] hover:to-[#004d5e] text-white shadow-md transition-all mt-1"
            >
              {isLoading ? "Definindo senha..." : "Definir senha"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
