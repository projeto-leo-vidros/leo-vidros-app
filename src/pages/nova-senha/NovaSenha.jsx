import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Check, X } from "lucide-react";
import { Paper } from "@mui/material";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import Button from "../../components/ui/Button/Button.component";
import Api from "../../api/client/Api";

const PasswordRequirement = ({ text, isValid }) => (
  <div
    className={`flex items-center gap-2 text-base transition-colors duration-200 font-[Inter] ${
      isValid ? "text-green-700" : "text-gray-700"
    }`}
  >
    {isValid ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-gray-500" />
    )}
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
  const navigate = useNavigate();

  const [userName, setUserName] = useState("Carregando...");

  useEffect(() => {
    const loggedUserName = sessionStorage.getItem("nome");

    if (loggedUserName) {
      setUserName(loggedUserName);
    } else {
      setUserName("Usuário");
    }
  }, [idUsuario]);

  const [showPassword, setShowPassword] = useState(false);

  // --- Dados e Cores ---
  const primaryDarkColor = "#003d6b";

  // --- Lógica de Validação ---
  const is8Chars = novaSenha.length >= 8;
  const isUppercase = /[A-Z]/.test(novaSenha);
  const isNumber = /[0-9]/.test(novaSenha);
  const passwordsMatch = novaSenha === confirmaSenha && novaSenha.length > 0;

  const isFormValid = is8Chars && isUppercase && isNumber && passwordsMatch;

  const handleToggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  // --- Handler de Submissão ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isFormValid) {
      setError(
        "Verifique se todos os requisitos de senha foram atendidos e se as senhas coincidem.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await Api.put("/usuarios/definir-senha", {
        idUsuario: parseInt(idUsuario),
        novaSenha: novaSenha,
      });

      if (response.status === 200 || response.status === 204) {
        setSuccess("Senha definida com sucesso! Redirecionando...");
        localStorage.setItem("firstLogin", "false");

        setTimeout(() => {
          navigate("/pagina-inicial");
        }, 1500);
      } else {
        const errorData = response.data;
        const errorMessage =
          errorData.message || "Erro ao definir a senha. Tente novamente.";
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Erro na API:", err);
      setError(
        err.response?.data?.message ||
          "Falha na comunicação com o servidor. Verifique sua conexão.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fa] flex items-center justify-center p-4 font-[Inter]">
      <Paper
        elevation={3}
        className="rounded-xl shadow-2xl p-10 w-full max-w-md mx-auto relative"
      >
        <div className="flex flex-col items-center text-center">
          <img
            src="/src/assets/logo/logo-sidebar.png"
            alt="Logo Léo Vidros"
            className="w-32 mb-6"
          />

          <h2 className="text-xl font-normal text-gray-700 mb-2">
            Seja bem vindo
          </h2>

          <h1 className="text-3xl font-semibold text-gray-800 mb-8 w-full">
            {userName}
          </h1>
          <p className="text-gray-600 mb-12 text-lg">
            Defina sua senha para começar a utilizar o sistema
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <div className="mb-8 text-left">
              <UniversalInput
                label="Nova senha:"
                type="password"
                id="novaSenha"
                placeholder="********"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                startIcon={<Lock className="w-5 h-5" />}
                className="bg-[#f5f8fa] border-none"
              />
            </div>

            <div className="mb-10 text-left">
              <UniversalInput
                label="Digite a senha novamente:"
                type="password"
                id="confirmaSenha"
                placeholder="********"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
                error={confirmaSenha.length > 0 && !passwordsMatch ? "As senhas não coincidem" : null}
                startIcon={<Lock className="w-5 h-5" />}
                className="bg-[#f5f8fa] border-none"
              />
            </div>

            <div className="flex flex-col items-start space-y-3 mb-10">
              <PasswordRequirement
                text="Pelo menos 8 caracteres"
                isValid={is8Chars}
              />
              <PasswordRequirement
                text="Pelo menos 1 letra maiúscula"
                isValid={isUppercase}
              />
              <PasswordRequirement
                text="Pelo menos 1 número"
                isValid={isNumber}
              />
              <PasswordRequirement
                text="As senhas coincidem"
                isValid={passwordsMatch}
              />
            </div>

            {success && (
              <p className="text-green-600 text-sm mb-10 bg-green-100 p-3 rounded-lg border border-green-300 w-full text-center">
                {success}
              </p>
            )}

            {error && (
              <p className="text-red-600 text-sm mb-10 bg-red-100 p-3 rounded-lg border border-red-300 w-full text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!isFormValid || isLoading}
              className="w-full mt-4 py-4 text-lg font-bold rounded-lg"
              style={{
                backgroundColor: primaryDarkColor,
              }}
            >
              {isLoading ? "Definindo Senha..." : "Definir senha"}
            </Button>
          </form>
        </div>
      </Paper>
    </div>
  );
}
