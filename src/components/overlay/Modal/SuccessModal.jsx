import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { CheckCircle } from "lucide-react";

export default function SuccessModal({
  open,
  onClose,
  title = "Sucesso!",
  message,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="success-modal-title"
      aria-describedby="success-modal-description"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={(theme) => ({
          position: "relative",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: theme.shadows[5],
          p: 4,
          textAlign: "center",
        })}
      >
        <CheckCircle
          size={60}
          className="text-green-500 mb-2 mx-auto"
        />

        <Typography
          id="success-modal-title"
          variant="h6"
          component="h2"
          fontWeight="bold"
        >
          {title}
        </Typography>

        <Typography id="success-modal-description" sx={{ mt: 2 }}>
          {message}
        </Typography>

        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            mt: 3,
            bgcolor: "#007EA7",
            "&:hover": {
              bgcolor: "#006891",
            },
          }}
        >
          Fechar
        </Button>
      </Box>
    </Modal>
  );
}
