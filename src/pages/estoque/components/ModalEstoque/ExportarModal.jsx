import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { EtlApi } from "../../../../api/client/Api"; // Ajuste o caminho conforme a sua estrutura de pastas
import Swal from "sweetalert2";
import Button from "../../../../components/ui/Button/Button.component";
import { modalClasses } from "../../../../components/ui/modal/modalStyles";

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
      className={modalClasses.overlay}
      onClick={!isExporting ? onClose : undefined}
    >
      <div
        className={`${modalClasses.panel} mx-auto w-full max-w-lg`}
        onClick={handleModalContentClick}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className={modalClasses.headerTitle}>Exportar planilha</h2>
              <p className={modalClasses.headerSubtitle}>
                Gere um arquivo com a visao atual do estoque.
              </p>
            </div>
          </div>
        </div>

        <div className={modalClasses.body}>
          <p className="text-sm text-gray-700">
            Você está prestes a exportar a visualização atual do estoque.
            Confirme para iniciar o download.
          </p>
        </div>

        <div className={modalClasses.footer}>
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
