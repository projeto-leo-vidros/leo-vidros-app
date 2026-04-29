import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import FeedbackDialog from "../../../../components/feedback/FeedbackDialog/FeedbackDialog";
import Button from "../../../../components/ui/Button/Button.component";

export default function DeleteFuncionario({
  open,
  setOpen,
  funcionario,
  deletarFuncionario,
}) {
  const [confirmNome, setConfirmNome] = useState("");

  useEffect(() => {
    setConfirmNome("");
  }, [open]);

  const handleDelete = () => {
    if (funcionario && confirmNome === funcionario.nome) {
      deletarFuncionario(funcionario.id);
      setOpen(false);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Nome incorreto",
        text: "O nome digitado nÃ£o confere com o nome do funcionÃ¡rio.",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  return (
    <FeedbackDialog
      isOpen={open}
      onClose={() => setOpen(false)}
      tone="danger"
      icon={Trash2}
      title="Confirmar exclusao"
      description="Digite o nome completo do funcionario para confirmar a exclusao permanente."
      badge="Acao critica"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)} fullWidth>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} fullWidth>
            Excluir
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {funcionario && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              Funcionario selecionado
            </p>
            <p className="mt-1 text-sm font-medium text-slate-800">{funcionario.nome}</p>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Digite o nome completo para confirmar
          </span>
          <input
            type="text"
            value={confirmNome}
            onChange={(e) => setConfirmNome(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#007EA7] focus:ring-4 focus:ring-sky-100"
          />
        </label>
      </div>
    </FeedbackDialog>
  );
}
