import { AlertTriangle } from "lucide-react";
import Button from "../../../../components/ui/Button/Button.component";

const InativarProdutoModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-auto text-center"
        onClick={handleModalClick}
      >
        <div className="mx-auto mb-4 w-fit bg-gray-100 p-2 rounded">
          <AlertTriangle className="w-6 h-6 text-gray-700" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Inativar Produto
        </h3>
        <br />
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Esta ação não irá deletar o produto. Ele apenas será marcado como{" "}
          <strong>inativo</strong> para fins de histórico e não aparecerá mais
          nas operações ativas.
        </p>
        <br />
        <div className="flex items-center justify-between mt-4 gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={onConfirm}
            fullWidth
          >
            Inativar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InativarProdutoModal;
