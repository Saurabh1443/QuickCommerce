import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import PersonIcon from "@mui/icons-material/Person";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

const OPTIONS = [
  {
    to: "/register/customer",
    icon: PersonIcon,
    title: "I'm a customer",
    subtitle: "Order groceries and essentials from shops near me.",
  },
  {
    to: "/register/shopkeeper",
    icon: StorefrontIcon,
    title: "I own a shop",
    subtitle: "List my shop and sell to nearby customers.",
  },
  {
    to: "/register/delivery",
    icon: DeliveryDiningIcon,
    title: "I want to deliver",
    subtitle: "Become a delivery partner and earn on your own schedule.",
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  return (
    <Stack spacing={3} alignItems="center" py={4}>
      <Typography variant="h4" fontWeight={700}>
        Join QuickCommerce
      </Typography>
      <Typography color="text.secondary">Tell us how you'd like to use QuickCommerce.</Typography>
      <Grid container spacing={2} maxWidth={800}>
        {OPTIONS.map(({ to, icon: Icon, title, subtitle }) => (
          <Grid item xs={12} sm={4} key={to}>
            <Card>
              <CardActionArea onClick={() => navigate(to)} sx={{ p: 2 }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Icon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography fontWeight={600}>{title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {subtitle}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
