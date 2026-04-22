import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { UserCircle, Mail, BadgeCheck, Phone, ArrowLeft } from "lucide-react";
import FeedbackModal from "../../components/feedback/FeedbackModal/FeedbackModal";
import Logo from "../../assets/logo-sidebar.png";
import BgImage from "../../assets/GlazierAdobeStock_576236137.jpeg";
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
  const [errorType, setErrorType] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = ["Nome", "Email", "CPF", "Telefone"];

  const clearFieldError = () => {
    if (errorType === "field") {
      setError("");
      setErrorType(null);
    }
  };

  const handleCpfChange = (e) => {
    clearFieldError();
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value);
  };

  const handleTelefoneChange = (e) => {
    clearFieldError();
    let value = e.target.value.replace(/\D/g, "").slice(0, 11);
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    setTelefone(value);
  };

  const handleSimpleChange = (setter) => (e) => {
    clearFieldError();
    setter(e.target.value);
  };

  const setFieldError = (message) => {
    setError(message);
    setErrorType("field");
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError("");
    setErrorType(null);

    if (step === 1 && !nome.trim()) {
      setFieldError("Digite o nome");
      return;
    }

    if (step === 2 && !email.trim()) {
      setFieldError("Digite o email");
      return;
    }

    if (step === 3) {
      const cpfNumbers = cpf.replace(/\D/g, "");
      if (!cpfNumbers || cpfNumbers.length !== 11) {
        setFieldError("Digite um CPF v\u00e1lido");
        return;
      }
    }

    if (step === 4) {
      const telefoneNumbers = telefone.replace(/\D/g, "");
      if (!telefoneNumbers || telefoneNumbers.length !== 11) {
        setFieldError("Digite um telefone v\u00e1lido");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    handleCadastro(e);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setError("");
    setErrorType(null);
    setLoading(true);

    try {
      await Api.post("/solicitacoes", {
        nome,
        cpf: cpf.replace(/[^\d]/g, ""),
        telefone: telefone.replace(/[^\d]/g, ""),
        email,
      });
      setModalOpen(true);
      setTimeout(() => {
        setModalOpen(false);
        navigate("/login");
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Erro ao realizar cadastro.");
      setErrorType("submit");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const fieldError = errorType === "field" ? error : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center text-center bg-gradient-to-t from-[#dff0f5] via-[#edf6f9] to-white">
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
          className="h-[620px] w-full max-w-md rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-xl sm:px-10"
        >
          <div className="mx-auto flex h-full w-full max-w-[372px] flex-col items-center justify-center gap-6">
            <div className="flex w-full flex-shrink-0 flex-col items-center gap-2 text-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <img src={Logo} alt="Logo" className="h-10 w-auto" />
                <h1 className="text-2xl font-bold text-[#111827]">Criar conta</h1>
                <p className="text-sm text-[#6b7280]">
                  Preencha os dados para criar sua conta
                </p>
              </div>

              <div className="mt-4 w-full">
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
            </div>

            <form onSubmit={handleNext} className="mt-3 flex w-full flex-col items-center">
              <div className="flex w-full min-h-[112px] items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    {step === 1 && (
                      <UniversalInput
                        variant="underline"
                        label="Nome"
                        placeholder="Digite seu nome"
                        value={nome}
                        onChange={handleSimpleChange(setNome)}
                        error={fieldError}
                        wrapperClassName="gap-3"
                        startIcon={<UserCircle size={20} />}
                      />
                    )}
                    {step === 2 && (
                      <UniversalInput
                        variant="underline"
                        label="Email"
                        type="email"
                        placeholder="Digite seu email"
                        value={email}
                        onChange={handleSimpleChange(setEmail)}
                        error={fieldError}
                        wrapperClassName="gap-3"
                        startIcon={<Mail size={20} />}
                      />
                    )}
                    {step === 3 && (
                      <UniversalInput
                        variant="underline"
                        label="CPF"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCpfChange}
                        error={fieldError}
                        wrapperClassName="gap-3"
                        startIcon={<BadgeCheck size={20} />}
                      />
                    )}
                    {step === 4 && (
                      <UniversalInput
                        variant="underline"
                        label="Telefone"
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={handleTelefoneChange}
                        error={fieldError}
                        wrapperClassName="gap-3"
                        startIcon={<Phone size={20} />}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex min-h-[48px] w-full items-start justify-center">
                <AnimatePresence>
                  {errorType === "submit" && error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 shadow-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-2 flex w-full flex-col-reverse items-center gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 cursor-pointer rounded-xl bg-[#003d5b] py-4 font-semibold text-white shadow-md transition-all hover:bg-[#002d44]"
                >
                  {loading ? "Processando..." : step < 4 ? "Pr\u00f3ximo" : "Solicitar cadastro"}
                </Button>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setErrorType(null);
                      setStep(step - 1);
                    }}
                    className="flex cursor-pointer items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#6b7280] shadow-sm transition-all hover:border-gray-300"
                  >
                    <ArrowLeft size={15} />
                    Voltar
                  </button>
                )}
              </div>
            </form>

            <div className="flex w-full flex-col gap-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium text-gray-400">ou</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <p className="text-center text-sm text-[#6b7280]">
                {"J\u00e1 tem uma conta? "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="cursor-pointer font-semibold text-[#007EA7] transition-colors hover:text-[#005f73]"
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
        description={"Aguarde a aprova\u00e7\u00e3o do administrador. Redirecionando..."}
        duration={3000}
      />
    </div>
  );
}

export default Cadastro;
