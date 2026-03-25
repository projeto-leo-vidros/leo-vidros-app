import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { EtlApi } from "../../../../api/client/Api"; // Ajuste o caminho conforme a sua estrutura de pastas
import Swal from "sweetalert2";
import Button from "../../../../components/ui/Button/Button.component";

const ExportarModal = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportar = async () => {
    try {
      setIsExporting(true);

      const response = await EtlApi.get("/excel/export/estoque", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "relatorio_estoque.xlsx");

      document.body.appendChild(link);

      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Erro ao exportar planilha:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Não foi possível exportar o estoque. Tente novamente mais tarde.",
        confirmButtonColor: "#007EA7",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={!isExporting ? onClose : undefined}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto"
        onClick={handleModalContentClick}
      >
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-2 rounded">
              <Download className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Exportar planilha
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Você está prestes a exportar a visualização atual do estoque.
            Confirme para iniciar o download.
          </p>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isExporting}
            size="sm"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleExportar}
            disabled={isExporting}
            size="sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exportando...
              </>
            ) : (
              "Exportar Planilha"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportarModal;
