import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserCircle, Mail, BadgeCheck, Phone } from "lucide-react";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import UniversalInput from "../../components/ui/Input/UniversalInput";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import {
  QontoConnector,
  QontoStepIcon,
} from "../../components/stepper/QontoStepper.jsx";
import Button from "../../components/ui/Button/Button.component";
import Api from "../../api/client/Api";

function Cadastro() {
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = ["Nome", "Email", "CPF", "Telefone"];

  const handleCpfChange = (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    setTelefone(value);
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");

    if (step === 1 && !nome) return setError("Digite o nome");
    if (step === 2 && !email) return setError("Digite o email");

    if (step === 3) {
      const cpfNumbers = cpf.replace(/\D/g, "");
      if (!cpfNumbers || cpfNumbers.length !== 11)
        return setError("Digite um CPF válido");
    }

    if (step === 4) {
      const telefoneNumbers = telefone.replace(/\D/g, "");
      if (!telefoneNumbers || telefoneNumbers.length !== 11)
        return setError("Digite um telefone válido");
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleCadastro(e);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const dadosCadastro = {
        nome,
        cpf: cpf.replace(/[^\d]/g, ""),
        telefone: telefone.replace(/[^\d]/g, ""),
        email,
      };

      await Api.post("/solicitacoes", dadosCadastro);

      setModalOpen(true);

      setTimeout(() => {
        setModalOpen(false);
        navigate("/Login");
      }, 3000);
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError(
        error.response?.data?.message ||
          "Erro ao realizar cadastro. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
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
        <div
          className="hidden lg:flex flex-1 h-[600px] rounded-xl bg-cover bg-center shadow-lg"
          style={{
            backgroundImage:
              'url("/src/assets/images/GlazierAdobeStock_576236137.jpeg")',
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 rounded-xl relative"
        >
          <div className="flex flex-col gap-8">
            <div className="mb-10 text-center flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-[#111827] mb-2">
                Criar conta
              </h1>
              <p className="text-[#6b7280] text-sm">
                Preencha os dados para criar sua conta
              </p>
            </div>

            <div className="mb-10">
              <Stepper
                alternativeLabel
                activeStep={step - 1}
                connector={<QontoConnector />}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel StepIconComponent={QontoStepIcon}>
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </div>

            <form onSubmit={handleNext} className="space-y-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                  >
                    <UniversalInput
                      variant="underline"
                      label="Nome"
                      placeholder="Digite seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      startIcon={<UserCircle size={30} />}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                  >
                    <UniversalInput
                      variant="underline"
                      label="Email"
                      type="email"
                      placeholder="Digite seu email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      startIcon={<Mail size={30} />}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                  >
                    <UniversalInput
                      variant="underline"
                      label="CPF"
                      placeholder="Digite seu CPF"
                      value={cpf}
                      onChange={handleCpfChange}
                      startIcon={<BadgeCheck size={30} />}
                    />
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                  >
                    <UniversalInput
                      variant="underline"
                      label="Telefone"
                      placeholder="Digite seu telefone"
                      value={telefone}
                      onChange={handleTelefoneChange}
                      startIcon={<Phone size={30} />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3 items-center justify-center pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="flex-1 bg-[#007EA7] text-white font-medium py-4 rounded-lg max-w-xl cursor-pointer"
                >
                  {loading
                    ? "Processando..."
                    : step < 4
                      ? "Próximo"
                      : "Solicitar cadastro"}
                </Button>
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(step - 1)}
                  >
                    Voltar
                  </Button>
                )}
              </div>
            </form>

            <div className="my-8">
              <div className="h-px bg-black w-full" />
            </div>

            <div className="text-center">
              <p className="text-sm text-[#6b7280]">
                Já possui uma conta?{" "}
                <button
                  type="button"
                  onClick={() => (window.location.href = "/Login")}
                  className="text-[#007EA7] hover:text-[#005f73] font-medium transition-colors cursor-pointer"
                >
                  Login
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
        title="Cadastro realizado com sucesso!"
        description="Aguarde a aprovação do administrador. Redirecionando..."
        duration={3000}
      />
    </div>
  );
}

export default Cadastro;
