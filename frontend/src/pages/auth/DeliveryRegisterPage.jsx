import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";
import { extractErrorMessage } from "../../services/api";

const initialForm = {
  owner: { name: "", email: "", phone: "", password: "" },
  vehicle_type: "bike",
  vehicle_number: "",
  licence_number: "",
};

export default function DeliveryRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setOwner = (field) => (e) => setForm({ ...form, owner: { ...form.owner, [field]: e.target.value } });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.registerDeliveryPartner(form);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Stack alignItems="center" py={6} spacing={2}>
        <Alert severity="success" sx={{ maxWidth: 480 }}>
          Registration submitted! Your account is <strong>pending admin approval</strong>. You'll
          be able to go online and accept deliveries once approved.
        </Alert>
        <LoadingButton variant="contained" onClick={() => navigate("/login")}>
          Go to login
        </LoadingButton>
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" py={4}>
      <Card sx={{ maxWidth: 460, width: "100%" }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Become a delivery partner
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Full name" required fullWidth value={form.owner.name} onChange={setOwner("name")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Email" type="email" required fullWidth value={form.owner.email} onChange={setOwner("email")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Mobile number" required fullWidth value={form.owner.phone} onChange={setOwner("phone")} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                value={form.owner.password}
                onChange={setOwner("password")}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Vehicle type" fullWidth value={form.vehicle_type} onChange={set("vehicle_type")}>
                <MenuItem value="bike">Bike</MenuItem>
                <MenuItem value="scooter">Scooter</MenuItem>
                <MenuItem value="bicycle">Bicycle</MenuItem>
                <MenuItem value="car">Car</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Vehicle number" fullWidth value={form.vehicle_number} onChange={set("vehicle_number")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Driving licence number" fullWidth value={form.licence_number} onChange={set("licence_number")} />
            </Grid>
            <Grid item xs={12}>
              <LoadingButton type="submit" variant="contained" size="large" fullWidth loading={loading}>
                Submit for approval
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
