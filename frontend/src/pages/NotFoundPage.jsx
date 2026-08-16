import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Stack alignItems="center" spacing={2} py={10}>
      <Typography variant="h2" fontWeight={700} color="primary.main">
        404
      </Typography>
      <Typography color="text.secondary">This page doesn't exist.</Typography>
      <Button variant="contained" onClick={() => navigate("/")}>
        Go home
      </Button>
    </Stack>
  );
}
