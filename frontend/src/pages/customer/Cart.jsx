import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { EmptyState, SectionLoader } from "../../components/DataStates";
import QuantityStepper from "../../components/QuantityStepper";
import { formatCurrency } from "../../utils/format";
import {
  fetchCart,
  removeCartItem,
  selectCart,
  selectCartStatus,
  updateCartItem,
} from "../../store/slices/cartSlice";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const status = useSelector(selectCartStatus);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (status === "loading" && !cart) return <SectionLoader height={300} />;

  if (!cart || !cart.items?.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        subtitle="Browse shops near you and add some products to get started."
        action={
          <Button variant="contained" onClick={() => navigate("/customer/shops")}>
            Browse shops
          </Button>
        }
      />
    );
  }

  const totals = cart.totals;

  return (
    <Stack spacing={3} maxWidth={720}>
      <Typography variant="h5" fontWeight={700}>
        Your cart · {cart.shop?.name}
      </Typography>

      <Card>
        <CardContent>
          <Stack divider={<Divider sx={{ my: 1.5 }} />}>
            {cart.items.map((item) => (
              <Stack key={item.id} direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    bgcolor: "grey.100",
                    backgroundImage: item.product.image ? `url(${item.product.image})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    flexShrink: 0,
                  }}
                />
                <Box flexGrow={1} minWidth={0}>
                  <Typography fontWeight={600} noWrap>
                    {item.product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.product.unit} · {formatCurrency(item.unit_price)} each
                  </Typography>
                </Box>
                <QuantityStepper
                  quantity={item.quantity}
                  onIncrement={() => dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity + 1 }))}
                  onDecrement={() => dispatch(updateCartItem({ itemId: item.id, quantity: item.quantity - 1 }))}
                />
                <Typography fontWeight={600} minWidth={70} textAlign="right">
                  {formatCurrency(item.total_price)}
                </Typography>
                <IconButton size="small" onClick={() => dispatch(removeCartItem(item.id))}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
            Bill summary
          </Typography>
          <Stack spacing={1}>
            <Row label="Subtotal" value={totals.subtotal} />
            <Row label="Delivery fee" value={totals.delivery_fee} />
            {Number(totals.discount) > 0 && <Row label="Discount" value={`-${formatCurrency(totals.discount)}`} raw />}
            <Row label="Tax" value={totals.tax} />
            <Divider />
            <Row label="Total" value={totals.total} bold />
          </Stack>
        </CardContent>
      </Card>

      <Button variant="contained" size="large" onClick={() => navigate("/customer/checkout")}>
        Proceed to checkout
      </Button>
    </Stack>
  );
}

function Row({ label, value, bold, raw }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color={bold ? "text.primary" : "text.secondary"} fontWeight={bold ? 700 : 400}>
        {label}
      </Typography>
      <Typography fontWeight={bold ? 700 : 500}>{raw ? value : formatCurrency(value)}</Typography>
    </Stack>
  );
}
