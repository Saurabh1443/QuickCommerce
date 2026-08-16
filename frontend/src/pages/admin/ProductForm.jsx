import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ImageUpload from "../../components/ImageUpload";
import { categoryService } from "../../services/categoryService";
import { extractErrorMessage } from "../../services/api";
import { productService } from "../../services/productService";
import { shopService } from "../../services/shopService";

const emptyForm = {
  shop: "", name: "", description: "", category: "", price: "", discount_price: "",
  unit: "", stock_quantity: "0",
};

export default function AdminProductForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
    shopService.adminList({ status: "APPROVED" }).then(({ data }) => setShops(data.results || data)).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "discount_price" && !value) return;
        payload.append(key, value);
      });
      payload.append("is_available", "true");
      if (imageFile) payload.append("image", imageFile);
      await productService.create(payload);
      navigate("/admin/products");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack maxWidth={640}>
      <Card>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Add product
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload file={imageFile} onChange={setImageFile} label="Product image" />
            </Grid>
            <Grid item xs={12}>
              <TextField select label="Shop" required fullWidth value={form.shop} onChange={set("shop")}>
                {shops.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField label="Product name" required fullWidth value={form.name} onChange={set("name")} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Unit (e.g. 500 ml)" required fullWidth value={form.unit} onChange={set("unit")} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" fullWidth multiline minRows={2} value={form.description} onChange={set("description")} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Category" required fullWidth value={form.category} onChange={set("category")}>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Price (₹)" type="number" required fullWidth value={form.price} onChange={set("price")} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Discounted price (₹, optional)"
                type="number"
                fullWidth
                value={form.discount_price}
                onChange={set("discount_price")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Stock quantity"
                type="number"
                required
                fullWidth
                value={form.stock_quantity}
                onChange={set("stock_quantity")}
              />
            </Grid>
            <Grid item xs={12}>
              <LoadingButton type="submit" variant="contained" size="large" loading={saving}>
                Add product
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
