import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import ShopCard from "../../components/ShopCard";
import { categoryService } from "../../services/categoryService";
import { shopService } from "../../services/shopService";
import { extractErrorMessage } from "../../services/api";
import { selectLocation } from "../../store/slices/uiSlice";

export default function Home() {
  const navigate = useNavigate();
  const location = useSelector(selectLocation);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.list().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setStatus("loading");
    const params = location
      ? { latitude: location.latitude, longitude: location.longitude }
      : {};
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
  }, [location]);

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "#fff",
          borderRadius: 4,
          p: { xs: 3, md: 5 },
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Everyday essentials, from shops near you.
        </Typography>
        <Typography sx={{ opacity: 0.9, mb: 2 }}>
          {location ? `Showing shops near ${location.label}` : "Select your location to see nearby shops."}
        </Typography>
        <Button variant="contained" color="secondary" onClick={() => navigate("/customer/shops")}>
          Browse all shops
        </Button>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Shop by category
        </Typography>
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid item xs={4} sm={3} md={2} key={category.id}>
              <Card
                sx={{ cursor: "pointer", textAlign: "center" }}
                onClick={() => navigate(`/customer/shops?category=${category.id}`)}
              >
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {category.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Shops near you
        </Typography>
        {status === "loading" && <SectionLoader />}
        {status === "failed" && <ErrorState message={error} />}
        {status === "succeeded" && shops.length === 0 && (
          <EmptyState title="No shops found nearby" subtitle="Try selecting a different location." />
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
      </Box>
    </Stack>
  );
}
