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
import { useNavigate, useParams } from "react-router-dom";

import ImageUpload from "../../components/ImageUpload";
import { SectionLoader } from "../../components/DataStates";
import { categoryService } from "../../services/categoryService";
import { extractErrorMessage } from "../../services/api";
import { productService } from "../../services/productService";

const emptyForm = {
  name: "", description: "", category: "", price: "", discount_price: "",
  unit: "", stock_quantity: "0", is_available: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    productService
      .manageDetail(id)
      .then(({ data: product }) => {
        setForm({
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          discount_price: product.discount_price || "",
          unit: product.unit,
          stock_quantity: String(product.stock_quantity),
          is_available: product.is_available,
        });
        setExistingImage(product.image);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "discount_price" && !value) return;
        payload.append(key, key === "is_available" ? String(value) : value);
      });
      if (imageFile) payload.append("image", imageFile);

      if (isEdit) await productService.update(id, payload);
      else await productService.create(payload);

      navigate("/shopkeeper/products");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionLoader height={300} />;

  return (
    <Stack maxWidth={640}>
      <Card>
        <CardContent component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            {isEdit ? "Edit product" : "Add product"}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <ImageUpload value={existingImage} file={imageFile} onChange={setImageFile} label="Product image" />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField label="Product name" required fullWidth value={form.name} onChange={set("name")} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Unit (e.g. 500 ml)" required fullWidth value={form.unit} onChange={set("unit")} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={set("description")}
              />
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
            <Grid item xs={12} sm={6} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
                }
                label="Available for sale"
              />
            </Grid>
            <Grid item xs={12}>
              <LoadingButton type="submit" variant="contained" size="large" loading={saving}>
                {isEdit ? "Save changes" : "Add product"}
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
