import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";

export default function PublicLayout() {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AppBar position="sticky" color="default" sx={{ bgcolor: "background.paper" }}>
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, color: "primary.main", fontWeight: 700, textDecoration: "none" }}
          >
            QuickCommerce
          </Typography>
          <Stack direction="row" spacing={1.5}>
            <Button onClick={() => navigate("/login")}>Log in</Button>
            <Button variant="contained" onClick={() => navigate("/register")}>
              Sign up
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
      <Box component="footer" py={3} textAlign="center" color="text.secondary">
        <Typography variant="body2">
          © {new Date().getFullYear()} QuickCommerce — a local-shops marketplace MVP.
        </Typography>
      </Box>
    </Box>
  );
}
