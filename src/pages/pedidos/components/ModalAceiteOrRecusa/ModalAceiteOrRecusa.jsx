import { Check, TriangleAlert } from "lucide-react";
import PropTypes from "prop-types";
import Button from "../../../../components/ui/Button/Button.component";
import FeedbackDialog from "../../../../components/feedback/FeedbackDialog/FeedbackDialog";

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
  const aprovacao = tipo === "aprovar";

  return (
    <FeedbackDialog
      isOpen={aberto}
      onClose={onCancelar}
      tone={aprovacao ? "success" : "warning"}
      icon={aprovacao ? Check : TriangleAlert}
      title={titulo}
      description={mensagem}
      badge={aprovacao ? "Confirmacao" : "Atencao"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancelar} fullWidth>
            {textoBotaoCancelar}
          </Button>
          <Button variant={aprovacao ? "primary" : "danger"} onClick={onConfirmar} fullWidth>
            {textoBotaoConfirmar}
          </Button>
        </>
      }
    />
  );
}

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
