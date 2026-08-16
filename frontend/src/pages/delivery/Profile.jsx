import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { SectionLoader } from "../../components/DataStates";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";

export default function DeliveryProfile() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    deliveryService
      .profile()
      .then(({ data }) =>
        setForm({ vehicle_type: data.vehicle_type, vehicle_number: data.vehicle_number, licence_number: data.licence_number })
      )
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await deliveryService.updateProfile(form);
      setMessage("Profile updated.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <SectionLoader height={300} />;

  return (
    <Stack maxWidth={480}>
      <Card>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            My profile
          </Typography>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField select label="Vehicle type" fullWidth value={form.vehicle_type} onChange={set("vehicle_type")}>
                <MenuItem value="bike">Bike</MenuItem>
                <MenuItem value="scooter">Scooter</MenuItem>
                <MenuItem value="bicycle">Bicycle</MenuItem>
                <MenuItem value="car">Car</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Vehicle number" fullWidth value={form.vehicle_number} onChange={set("vehicle_number")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Driving licence number" fullWidth value={form.licence_number} onChange={set("licence_number")} />
            </Grid>
            <Grid item xs={12}>
              <LoadingButton type="submit" variant="contained" loading={saving}>
                Save changes
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
