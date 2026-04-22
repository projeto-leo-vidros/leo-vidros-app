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
      if (!cpfNumbers || cpfNumbers.length !== 11) return setError("Digite um CPF válido");
    }
    if (step === 4) {
      const telefoneNumbers = telefone.replace(/\D/g, "");
      if (!telefoneNumbers || telefoneNumbers.length !== 11) return setError("Digite um telefone válido");
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
      console.error("Erro no cadastro:", error);
      setError(error.response?.data?.message || "Erro ao realizar cadastro. Tente novamente.");
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
                <h1 className="text-3xl font-bold text-[#111827]">Criar conta</h1>
                <p className="text-[#6b7280] text-sm">
                  Preencha os dados para criar sua conta
                </p>
              </div>
            </div>

            <Stepper
              alternativeLabel
              activeStep={step - 1}
              connector={<QontoConnector />}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={handleNext} className="flex flex-col gap-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <UniversalInput variant="underline" label="Nome" placeholder="Digite seu nome" value={nome}
                      onChange={(e) => setNome(e.target.value)} startIcon={<UserCircle size={20} />} />
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <UniversalInput variant="underline" label="Email" type="email" placeholder="Digite seu email" value={email}
                      onChange={(e) => setEmail(e.target.value)} startIcon={<Mail size={20} />} />
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <UniversalInput variant="underline" label="CPF" placeholder="000.000.000-00" value={cpf}
                      onChange={handleCpfChange} startIcon={<BadgeCheck size={20} />} />
                  </motion.div>
                )}
                {step === 4 && (
                  <motion.div key="step4" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                    <UniversalInput variant="underline" label="Telefone" placeholder="(00) 00000-0000" value={telefone}
                      onChange={handleTelefoneChange} startIcon={<Phone size={20} />} />
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </motion.div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-[#007EA7] to-[#005f73] hover:from-[#006d93] hover:to-[#004d5e] text-white font-semibold py-4 rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {loading ? "Processando..." : step < 4 ? "Próximo" : "Solicitar cadastro"}
                </Button>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center justify-center gap-1 text-sm font-semibold text-[#6b7280] bg-white border border-gray-200 hover:border-gray-300 hover:text-[#111827] transition-all cursor-pointer rounded-xl py-4 px-5 shadow-sm"
                  >
                    <ArrowLeft size={16} />
                    Voltar
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px bg-gray-200 flex-1" />
              <span className="text-xs text-gray-400 font-medium">ou</span>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <p className="text-sm text-[#6b7280] text-center">
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#007EA7] hover:text-[#005f73] font-semibold transition-colors cursor-pointer"
              >
                Fazer login
              </button>
            </p>
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
