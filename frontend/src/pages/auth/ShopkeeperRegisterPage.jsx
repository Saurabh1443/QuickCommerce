import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MapPicker from "../../components/MapPicker";
import { categoryService } from "../../services/categoryService";
import { extractErrorMessage } from "../../services/api";
import { authService } from "../../services/authService";

const initialForm = {
  owner: { name: "", email: "", phone: "", password: "" },
  shop: {
    name: "",
    category: "",
    description: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  },
  kyc: { gst_number: "", pan_number: "", bank_account_name: "", bank_account_number: "", bank_ifsc: "" },
};

export default function ShopkeeperRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [point, setPoint] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  const set = (section, field) => (e) =>
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: e.target.value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!point?.lat) {
      setError("Please pick your shop's location on the map.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.registerShopkeeper({
        owner: form.owner,
        shop: { ...form.shop, latitude: point.lat, longitude: point.lng },
        kyc: form.kyc,
      });
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
          Registration submitted! Your shop is now <strong>pending admin approval</strong>. You'll
          be able to log in and add products once it's approved.
        </Alert>
        <LoadingButton variant="contained" onClick={() => navigate("/login")}>
          Go to login
        </LoadingButton>
      </Stack>
    );
  }

  return (
    <Stack alignItems="center" py={4}>
      <Card sx={{ maxWidth: 640, width: "100%" }}>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Register your shop
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Owner details
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Your name" required fullWidth value={form.owner.name} onChange={set("owner", "name")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Mobile number" required fullWidth value={form.owner.phone} onChange={set("owner", "phone")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" required fullWidth value={form.owner.email} onChange={set("owner", "email")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type="password"
                required
                fullWidth
                value={form.owner.password}
                onChange={set("owner", "password")}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Shop details
          </Typography>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Shop name" required fullWidth value={form.shop.name} onChange={set("shop", "name")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Category"
                required
                fullWidth
                value={form.shop.category}
                onChange={set("shop", "category")}
              >
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={form.shop.description}
                onChange={set("shop", "description")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Shop phone" required fullWidth value={form.shop.phone} onChange={set("shop", "phone")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Pincode" required fullWidth value={form.shop.pincode} onChange={set("shop", "pincode")} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                required
                fullWidth
                value={form.shop.address_line}
                onChange={set("shop", "address_line")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="City" required fullWidth value={form.shop.city} onChange={set("shop", "city")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="State" required fullWidth value={form.shop.state} onChange={set("shop", "state")} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} mb={1}>
                Shop location
              </Typography>
              <MapPicker value={point} onChange={setPoint} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            Business / KYC details (optional for now)
          </Typography>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6}>
              <TextField label="GST number" fullWidth value={form.kyc.gst_number} onChange={set("kyc", "gst_number")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="PAN number" fullWidth value={form.kyc.pan_number} onChange={set("kyc", "pan_number")} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bank account name"
                fullWidth
                value={form.kyc.bank_account_name}
                onChange={set("kyc", "bank_account_name")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bank account number"
                fullWidth
                value={form.kyc.bank_account_number}
                onChange={set("kyc", "bank_account_number")}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="IFSC code" fullWidth value={form.kyc.bank_ifsc} onChange={set("kyc", "bank_ifsc")} />
            </Grid>
          </Grid>

          <LoadingButton type="submit" variant="contained" size="large" fullWidth loading={loading}>
            Submit for approval
          </LoadingButton>
          <Typography variant="caption" color="text.secondary" display="block" mt={1} textAlign="center">
            An administrator will review and approve your shop before it appears to customers.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
