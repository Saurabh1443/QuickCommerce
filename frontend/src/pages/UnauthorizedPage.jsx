import { Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { UnauthorizedState } from "../components/DataStates";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Stack alignItems="center" spacing={2} py={6}>
      <UnauthorizedState message="Your account role doesn't have access to this page." />
      <Button variant="contained" onClick={() => navigate("/")}>
        Go home
      </Button>
    </Stack>
  );
}
