import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import StarIcon from "@mui/icons-material/Star";
import { Box, Card, CardContent, CardMedia, Chip, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ShopCard({ shop }) {
  const navigate = useNavigate();
  const eta = shop.eta_minutes;

  return (
    <Card
      sx={{ cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}
      onClick={() => navigate(`/customer/shop/${shop.slug}`)}
    >
      <CardMedia
        component="div"
        sx={{
          height: 140,
          bgcolor: "grey.100",
          backgroundImage: shop.image ? `url(${shop.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {!shop.is_open_now && (
          <Chip
            label="Closed"
            size="small"
            color="default"
            sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(17,24,39,0.75)", color: "#fff" }}
          />
        )}
      </CardMedia>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {shop.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {shop.category_name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
          <Chip
            icon={<StarIcon sx={{ fontSize: 14 }} />}
            label={Number(shop.rating).toFixed(1)}
            size="small"
            color="success"
            variant="filled"
          />
          {shop.distance_km != null && (
            <Stack direction="row" spacing={0.3} alignItems="center">
              <PlaceIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {shop.distance_km} km
              </Typography>
            </Stack>
          )}
        </Stack>
        {eta && (
          <Stack direction="row" spacing={0.3} alignItems="center" mt={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {eta.min}-{eta.max} min
            </Typography>
          </Stack>
        )}
        {Number(shop.min_order_value) > 0 && (
          <Box mt={0.5}>
            <Typography variant="caption" color="text.secondary">
              Min order ₹{shop.min_order_value}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
