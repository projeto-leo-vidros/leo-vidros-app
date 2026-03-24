import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import PropTypes from "prop-types"; // Importação adicionada
import Button from "../../../../components/ui/Button/Button.component";

export default function ModalConfirmacao({
  aberto,
  tipo = "aprovar",
  titulo,
  mensagem,
  textoBotaoConfirmar,
  textoBotaoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}) {
  const estilos = {
    aprovar: {
      iconeBg: "bg-green-100",
      iconeCor: "text-green-600",
      botao: "bg-[#007EA7] hover:bg-[#006b8f]",
    },
    recusar: {
      iconeBg: "bg-yellow-100",
      iconeCor: "text-yellow-600",
      botao: "bg-[#007EA7] hover:bg-[#006b8f]",
    },
  };

  const estilo = estilos[tipo] || estilos.aprovar;

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onCancelar}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-6">
              <div
                className={`w-12 h-12 rounded-full ${estilo.iconeBg} flex items-center justify-center`}
              >
                {tipo === "aprovar" ? (
                  <Check className={`w-6 h-6 ${estilo.iconeCor}`} />
                ) : (
                  <svg
                    className={`w-6 h-6 ${estilo.iconeCor}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {titulo}
                </h3>
                <p className="text-md text-gray-600">{mensagem}</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-8">
              <Button
                variant="ghost"
                onClick={onCancelar}
              >
                {textoBotaoCancelar}
              </Button>
              <Button
                variant="primary"
                onClick={onConfirmar}
              >
                {textoBotaoConfirmar}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Validação de Props adicionada
ModalConfirmacao.propTypes = {
  aberto: PropTypes.bool.isRequired,
  tipo: PropTypes.oneOf(["aprovar", "recusar"]),
  titulo: PropTypes.string.isRequired,
  mensagem: PropTypes.string.isRequired,
  textoBotaoConfirmar: PropTypes.string.isRequired,
  textoBotaoCancelar: PropTypes.string,
  onConfirmar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};