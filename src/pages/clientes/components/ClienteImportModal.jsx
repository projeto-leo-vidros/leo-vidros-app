import { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import clientesService from "../../../api/services/clientesService";
import Button from "../../../components/ui/Button/Button.component";
import { modalClasses } from "../../../components/ui/modal/modalStyles";

export default function ClienteImportModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setSuccess(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError("");
      setSuccess(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const response = await clientesService.importarPlanilha(file);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(response.error || "Erro ao importar planilha.");
      }
    } catch (err) {
      setError("Erro inesperado ao enviar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError("");
    setSuccess(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={modalClasses.overlay}
      onClick={handleClose}
    >
      <div
        className={`${modalClasses.panel} w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalClasses.header}>
          <div className="flex items-center gap-3">
            <div className={modalClasses.headerIcon}>
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className={modalClasses.headerTitle}>Importar Clientes</h3>
              <p className={modalClasses.headerSubtitle}>
                Envie uma planilha para cadastrar em lote.
              </p>
            </div>
          </div>
        </div>

        <div className={modalClasses.body}>
          {!success ? (
            <>
              <div
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                   ${file ? "border-[#007EA7] bg-blue-50" : "border-gray-300 hover:border-[#007EA7] hover:bg-gray-50"}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="w-10 h-10 text-[#007EA7]" />
                    <span className="font-medium text-gray-700">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Clique para selecionar ou arraste o arquivo
                    </p>
                    <p className="text-xs text-gray-500">
                      Suporta arquivos .xlsx, .xls ou .csv
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!file || uploading}
                  size="sm"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    "Importar"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Importação Concluída!
              </h4>
              <p className="text-gray-500">
                Os clientes foram importados com sucesso.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ClienteImportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
