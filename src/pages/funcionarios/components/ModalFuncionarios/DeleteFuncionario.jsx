import { useEffect, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { muiModalSx } from "../../../../components/ui/modal/modalStyles";

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
      alert("O nome digitado nao confere com o funcionario.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      sx={muiModalSx}
      PaperProps={{ sx: { borderRadius: "28px" } }}
    >
      <DialogTitle sx={{ px: 3, py: 2.5, fontWeight: 700 }}>
        Confirmar Exclusao
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Typography mb={2}>
          Deseja realmente excluir este funcionario?
        </Typography>
        {funcionario && (
          <Typography mb={1}>Nome: {funcionario.nome}</Typography>
        )}
        <TextField
          fullWidth
          label="Digite o nome completo para confirmar"
          value={confirmNome}
          onChange={(e) => setConfirmNome(e.target.value)}
          margin="dense"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: "#f8fafc" }}>
        <Button onClick={handleDelete} variant="contained" color="error">
          Excluir
        </Button>
        <Button onClick={() => setOpen(false)}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
