import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { EtlApi } from "../../../../api/client/Api";
import FeedbackDialog from "../../../../components/feedback/FeedbackDialog/FeedbackDialog";
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
        text: "NÃ£o foi possÃ­vel exportar o estoque. Tente novamente mais tarde.",
        confirmButtonColor: "#007EA7",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <FeedbackDialog
      isOpen={isOpen}
      onClose={onClose}
      tone="info"
      icon={Download}
      title="Exportar planilha"
      description="Gere um arquivo com a visao atual do estoque e baixe a planilha em formato Excel."
      badge="Exportacao"
      size="md"
      closeOnOverlay={!isExporting}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isExporting} fullWidth>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExportar} disabled={isExporting} fullWidth>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              "Exportar planilha"
            )}
          </Button>
        </>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
        O arquivo sera gerado com os dados atualmente exibidos no estoque.
      </div>
    </FeedbackDialog>
  );
};

export default ExportarModal;
