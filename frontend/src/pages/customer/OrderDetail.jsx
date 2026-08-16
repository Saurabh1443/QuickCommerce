import { LoadingButton } from "@mui/lab";
import { Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog";
import { ErrorState, SectionLoader } from "../../components/DataStates";
import OrderTimeline from "../../components/OrderTimeline";
import StatusChip from "../../components/StatusChip";
import { extractErrorMessage } from "../../services/api";
import { orderService } from "../../services/orderService";
import { formatCurrency, formatDate } from "../../utils/format";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setStatus("loading");
    orderService
      .detail(id)
      .then(({ data }) => {
        setOrder(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, [id]);

  const handleCancel = async (reason) => {
    setCancelling(true);
    try {
      await orderService.cancel(id, reason);
      setCancelOpen(false);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

  const canCancel = ["PLACED", "ACCEPTED"].includes(order.status);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack>
              <Typography variant="h5" fontWeight={700}>
                {order.order_number}
              </Typography>
              <Typography color="text.secondary">
                {order.shop?.name} · {formatDate(order.created_at)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <StatusChip status={order.status} />
              <StatusChip status={order.payment_status} type="payment" />
            </Stack>
          </Stack>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Order tracking
              </Typography>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          {canCancel && (
            <LoadingButton color="error" variant="outlined" onClick={() => setCancelOpen(true)} sx={{ alignSelf: "flex-start" }}>
              Cancel order
            </LoadingButton>
          )}
        </Stack>
      </Grid>

      <Grid item xs={12} md={5}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                Items
              </Typography>
              <Stack spacing={1}>
                {order.items.map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between">
                    <Typography variant="body2">
                      {item.product_name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(item.total_price)}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={0.5}>
                <Row label="Subtotal" value={order.subtotal} />
                <Row label="Delivery fee" value={order.delivery_fee} />
                {Number(order.discount) > 0 && <Row label="Discount" value={-order.discount} />}
                <Divider />
                <Row label="Total" value={order.total_amount} bold />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Delivery address
              </Typography>
              <Typography variant="body2">{order.contact_name} · {order.contact_phone}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.full_address}
              </Typography>
            </CardContent>
          </Card>

          {order.delivery_partner && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  Delivery partner
                </Typography>
                <Typography variant="body2">{order.delivery_partner.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.delivery_partner.phone}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Grid>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this order?"
        description="Please tell us why you're cancelling."
        requireReason
        reasonLabel="Reason for cancellation"
        confirmLabel="Cancel order"
        confirmColor="error"
        loading={cancelling}
        onConfirm={handleCancel}
        onClose={() => setCancelOpen(false)}
      />
    </Grid>
  );
}

function Row({ label, value, bold }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography color={bold ? "text.primary" : "text.secondary"} fontWeight={bold ? 700 : 400}>
        {label}
      </Typography>
      <Typography fontWeight={bold ? 700 : 500}>{formatCurrency(value)}</Typography>
    </Stack>
  );
}
