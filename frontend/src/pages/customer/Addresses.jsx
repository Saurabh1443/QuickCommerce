import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import MapPicker from "../../components/MapPicker";
import { addressService } from "../../services/addressService";
import { extractErrorMessage } from "../../services/api";

const emptyAddress = { name: "", phone: "", address_line: "", landmark: "", city: "", state: "", pincode: "" };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [point, setPoint] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setStatus("loading");
    addressService
      .list()
      .then(({ data }) => {
        setAddresses(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  const handleSave = async () => {
  console.log("🔥 NEW handleSave EXECUTED");

  if (!point?.lat) {
    setError("Please pick a location on the map.");
    return;
  }

  console.log("POINT:", point);

  setSaving(true);

  try {
    const payload = {
      ...form,
      latitude: Number(point.lat.toFixed(6)),
      longitude: Number(point.lng.toFixed(6)),
    };

    console.log("🔥 PAYLOAD:", payload);

    await addressService.create(payload);

    setOpen(false);
    setForm(emptyAddress);
    setPoint(null);
  } catch (err) {
    setError(extractErrorMessage(err));
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async (id) => {
    await addressService.remove(id);
    load();
  };

  const handleSetDefault = async (id) => {
    await addressService.setDefault(id);
    load();
  };

  return (
    <Stack spacing={2} maxWidth={640}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          My addresses
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          Add address
        </Button>
      </Stack>

      {status === "loading" && <SectionLoader />}
      {status === "failed" && <ErrorState message={error} onRetry={load} />}
      {status === "succeeded" && addresses.length === 0 && <EmptyState title="No addresses saved" />}
      {status === "succeeded" &&
        addresses.map((address) => (
          <Card key={address.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{address.name}</Typography>
                    {address.is_default && <Chip label="Default" size="small" color="primary" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {address.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {address.full_address}
                  </Typography>
                  {!address.is_default && (
                    <Button size="small" sx={{ mt: 0.5, alignSelf: "flex-start" }} onClick={() => handleSetDefault(address.id)}>
                      Set as default
                    </Button>
                  )}
                </Stack>
                <IconButton onClick={() => handleDelete(address.id)}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add a new address</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} mt={1}>
            <Stack direction="row" spacing={2}>
              <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Phone" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Stack>
            <TextField
              label="Address line"
              fullWidth
              value={form.address_line}
              onChange={(e) => setForm({ ...form, address_line: e.target.value })}
            />
            <TextField
              label="Landmark (optional)"
              fullWidth
              value={form.landmark}
              onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField label="City" fullWidth value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <TextField label="State" fullWidth value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <TextField label="Pincode" fullWidth value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </Stack>
            <MapPicker value={point} onChange={setPoint} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
            Save address
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
