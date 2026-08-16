import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Button, IconButton, Stack, Typography } from "@mui/material";

export default function QuantityStepper({ quantity, onIncrement, onDecrement, onAdd, disabled }) {
  if (!quantity) {
    return (
      <Button variant="outlined" size="small" onClick={onAdd} disabled={disabled} sx={{ minWidth: 76 }}>
        ADD
      </Button>
    );
  }
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        border: "1px solid",
        borderColor: "primary.main",
        borderRadius: 2,
        px: 0.5,
      }}
    >
      <IconButton size="small" color="primary" onClick={onDecrement} disabled={disabled}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <Typography fontWeight={600} sx={{ minWidth: 20, textAlign: "center" }}>
        {quantity}
      </Typography>
      <IconButton size="small" color="primary" onClick={onIncrement} disabled={disabled}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}
