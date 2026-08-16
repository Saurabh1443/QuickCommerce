import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";

import { login, selectAuthError, selectAuthStatus, selectIsAuthenticated, selectRoleHome } from "../../store/slices/authSlice";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const roleHome = useSelector(selectRoleHome);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [form, setForm] = useState({ email: "", password: "" });

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || roleHome} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (!result.error) {
      navigate(location.state?.from?.pathname || "/", { replace: true });
    }
  };

  return (
    <Stack alignItems="center" py={4}>
      <Card sx={{ maxWidth: 420, width: "100%" }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Welcome back
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <LoadingButton type="submit" variant="contained" size="large" loading={status === "loading"}>
              Log in
            </LoadingButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
            New to QuickCommerce? <Link component={RouterLink} to="/register">Create an account</Link>
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
