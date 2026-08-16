import { Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import ShopCard from "../../components/ShopCard";
import { categoryService } from "../../services/categoryService";
import { shopService } from "../../services/shopService";
import { extractErrorMessage } from "../../services/api";
import { selectLocation } from "../../store/slices/uiSlice";

export default function Shops() {
  const location = useSelector(selectLocation);
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setStatus("loading");
    const params = {
      ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
      ...(search ? { search } : {}),
      ...(category ? { category } : {}),
    };
    shopService
      .nearby(params)
      .then(({ data }) => {
        setShops(data.results);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, [location, search, category]);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between">
        <Typography variant="h5" fontWeight={700}>
          {search ? `Results for "${search}"` : "All shops"}
        </Typography>
        <TextField
          select
          size="small"
          label="Category"
          sx={{ minWidth: 200 }}
          value={category}
          onChange={(e) => setSearchParams((p) => {
            const next = new URLSearchParams(p);
            if (e.target.value) next.set("category", e.target.value); else next.delete("category");
            return next;
          })}
        >
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {status === "loading" && <SectionLoader />}
      {status === "failed" && <ErrorState message={error} />}
      {status === "succeeded" && shops.length === 0 && (
        <EmptyState title="No shops found" subtitle="Try a different search or category." />
      )}
      {status === "succeeded" && shops.length > 0 && (
        <Grid container spacing={2}>
          {shops.map((shop) => (
            <Grid item xs={12} sm={6} md={4} key={shop.id}>
              <ShopCard shop={shop} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
