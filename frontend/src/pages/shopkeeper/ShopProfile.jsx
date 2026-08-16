import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import ImageUpload from "../../components/ImageUpload";
import MapPicker from "../../components/MapPicker";
import { SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { categoryService } from "../../services/categoryService";
import { extractErrorMessage } from "../../services/api";
import { shopService } from "../../services/shopService";

export default function ShopProfile() {
  const [shop, setShop] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [point, setPoint] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
    shopService
      .myShop()
      .then(({ data }) => {
        setShop(data);
        setForm({
          name: data.name,
          description: data.description,
          category: data.category,
          phone: data.phone,
          address_line: data.address_line,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          opening_time: data.opening_time?.slice(0, 5) || "09:00",
          closing_time: data.closing_time?.slice(0, 5) || "21:00",
          delivery_fee: data.delivery_fee,
          min_order_value: data.min_order_value,
          cod_enabled: data.cod_enabled,
          is_accepting_orders: data.is_accepting_orders,
        });
        setPoint({ lat: Number(data.latitude), lng: Number(data.longitude) });
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (point?.lat) {
        payload.set("latitude", point.lat);
        payload.set("longitude", point.lng);
      }
      if (imageFile) payload.append("image", imageFile);
      const { data } = await shopService.updateMyShop(payload);
      setShop(data);
      setMessage("Shop profile updated.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <SectionLoader height={300} />;

  return (
    <Stack maxWidth={680}>
      <Card>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={700}>
              Shop profile
            </Typography>
            <StatusChip status={shop.status} />
          </Stack>
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload value={shop.image} file={imageFile} onChange={setImageFile} label="Shop image" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Shop name" required fullWidth value={form.name} onChange={set("name")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Category" required fullWidth value={form.category} onChange={set("category")}>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={set("description")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone" fullWidth value={form.phone} onChange={set("phone")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Pincode" fullWidth value={form.pincode} onChange={set("pincode")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Address" fullWidth value={form.address_line} onChange={set("address_line")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="City" fullWidth value={form.city} onChange={set("city")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="State" fullWidth value={form.state} onChange={set("state")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Opening time" type="time" fullWidth value={form.opening_time} onChange={set("opening_time")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Closing time" type="time" fullWidth value={form.closing_time} onChange={set("closing_time")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Delivery fee (₹)" type="number" fullWidth value={form.delivery_fee} onChange={set("delivery_fee")} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Minimum order value (₹)"
                type="number"
                fullWidth
                value={form.min_order_value}
                onChange={set("min_order_value")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Switch checked={form.cod_enabled} onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })} />}
                label="Accept Cash on Delivery"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_accepting_orders}
                    onChange={(e) => setForm({ ...form, is_accepting_orders: e.target.checked })}
                  />
                }
                label="Currently accepting orders"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={600} mb={1}>
                Shop location
              </Typography>
              <MapPicker value={point} onChange={setPoint} />
            </Grid>
            <Grid item xs={12}>
              <LoadingButton type="submit" variant="contained" size="large" loading={saving}>
                Save changes
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
