import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Link, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";

import {
  registerCustomer,
  selectAuthError,
  selectAuthStatus,
  selectIsAuthenticated,
  selectRoleHome,
} from "../../store/slices/authSlice";

export default function CustomerRegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const roleHome = useSelector(selectRoleHome);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  if (isAuthenticated) return <Navigate to={roleHome} replace />;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerCustomer(form));
    if (!result.error) navigate("/customer", { replace: true });
  };

  return (
    <Stack alignItems="center" py={4}>
      <Card sx={{ maxWidth: 440, width: "100%" }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Create your customer account
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField label="Full name" required fullWidth value={form.name} onChange={set("name")} />
            <TextField label="Email" type="email" required fullWidth value={form.email} onChange={set("email")} />
            <TextField
              label="Mobile number"
              required
              fullWidth
              value={form.phone}
              onChange={set("phone")}
              helperText="10-digit Indian mobile number"
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={form.password}
              onChange={set("password")}
              helperText="At least 8 characters"
            />
            <LoadingButton type="submit" variant="contained" size="large" loading={status === "loading"}>
              Create account
            </LoadingButton>
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={2} textAlign="center">
            Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
