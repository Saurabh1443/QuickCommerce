import { Box, Card, CardContent, CardMedia, Chip, Stack, Typography } from "@mui/material";

import QuantityStepper from "./QuantityStepper";
import { formatCurrency } from "../utils/format";

export default function ProductCard({ product, quantity = 0, onAdd, onIncrement, onDecrement, disabled }) {
  const hasDiscount = product.discount_percent > 0;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardMedia
        component="div"
        sx={{
          height: 120,
          bgcolor: "grey.100",
          backgroundImage: product.image ? `url(${product.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {hasDiscount && (
          <Chip
            label={`${product.discount_percent}% OFF`}
            size="small"
            color="secondary"
            sx={{ position: "absolute", top: 8, left: 8 }}
          />
        )}
        {!product.in_stock && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Chip label="Out of stock" size="small" />
          </Box>
        )}
      </CardMedia>
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="body2" fontWeight={600} sx={{ minHeight: 40 }}>
          {product.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {product.unit}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mt={1.5}>
          <Stack direction="row" spacing={0.75} alignItems="baseline">
            <Typography fontWeight={700}>{formatCurrency(product.effective_price)}</Typography>
            {hasDiscount && (
              <Typography variant="caption" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                {formatCurrency(product.price)}
              </Typography>
            )}
          </Stack>
          <QuantityStepper
            quantity={quantity}
            onAdd={onAdd}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
            disabled={disabled || !product.in_stock}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
