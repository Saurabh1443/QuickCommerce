import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Stack alignItems="center" textAlign="center" spacing={2} py={{ xs: 4, md: 8 }}>
        <Typography variant="h3" fontWeight={700}>
          Your neighbourhood shops, delivered fast.
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth={640}>
          QuickCommerce connects local dukandars with nearby customers — browse, order and
          get everyday essentials delivered from shops you already trust.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} pt={2}>
          <Button size="large" variant="contained" onClick={() => navigate("/register")}>
            Order from local shops
          </Button>
          <Button size="large" variant="outlined" onClick={() => navigate("/register/shopkeeper")}>
            List your shop
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} py={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <StorefrontIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6">For shop owners</Typography>
              <Typography color="text.secondary">
                Register your shop, get approved, and start selling to customers nearby —
                manage products and orders from one dashboard.
              </Typography>
              <Button sx={{ mt: 1 }} onClick={() => navigate("/register/shopkeeper")}>
                Register as shopkeeper
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <DeliveryDiningIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6">For delivery partners</Typography>
              <Typography color="text.secondary">
                Go online whenever you want, pick up ready orders and deliver them at your
                own pace.
              </Typography>
              <Button sx={{ mt: 1 }} onClick={() => navigate("/register/delivery")}>
                Become a delivery partner
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                For customers
              </Typography>
              <Typography color="text.secondary">
                Discover shops near you, order groceries, snacks and daily essentials, and
                pay online or on delivery.
              </Typography>
              <Button sx={{ mt: 1 }} onClick={() => navigate("/register")}>
                Sign up free
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
