import Button from "../../../../components/ui/Button/Button.component";
import FeedbackDialog from "../../../../components/feedback/FeedbackDialog/FeedbackDialog";

const InativarProdutoModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <FeedbackDialog
      isOpen={isOpen}
      onClose={onClose}
      tone="warning"
      title="Inativar produto"
      description="O produto nao sera apagado. Ele apenas deixara de aparecer nas operacoes ativas e continuara disponivel no historico."
      badge="Atencao"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} fullWidth>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} fullWidth>
            Inativar
          </Button>
        </>
      }
    />
  );
};

export default InativarProdutoModal;
