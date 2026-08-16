import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog";
import { ErrorState, SectionLoader } from "../../components/DataStates";
import OrderTimeline from "../../components/OrderTimeline";
import StatusChip from "../../components/StatusChip";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";
import { orderService } from "../../services/orderService";
import { formatCurrency, formatDate } from "../../utils/format";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [acting, setActing] = useState(false);

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

  useEffect(() => {
    deliveryService.adminPartners().then(({ data }) => setPartners(data.filter((p) => p.is_approved && p.is_online)));
  }, []);

  const handleTransition = async (action, note = "") => {
    setActing(true);
    setError(null);
    try {
      await orderService.transition(order.id, action.status, note);
      setPendingAction(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPartner) return;
    setActing(true);
    setError(null);
    try {
      await deliveryService.adminAssign(order.id, selectedPartner);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;
  if (!order) return null;

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

          {error && <Alert severity="error">{error}</Alert>}

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Order tracking
              </Typography>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                Admin actions
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                {order.available_actions.map((action) => (
                  <LoadingButton
                    key={action.status}
                    variant={action.status === "CANCELLED" ? "outlined" : "contained"}
                    color={action.status === "CANCELLED" ? "error" : "primary"}
                    loading={acting}
                    onClick={() => (action.reason_required ? setPendingAction(action) : handleTransition(action))}
                  >
                    {action.label}
                  </LoadingButton>
                ))}
                {order.available_actions.length === 0 && (
                  <Typography color="text.secondary">No further actions available.</Typography>
                )}
              </Stack>

              {order.status === "READY_FOR_PICKUP" && !order.delivery_partner && (
                <Stack direction="row" spacing={1.5} mt={2} alignItems="center">
                  <TextField
                    select
                    size="small"
                    label="Assign delivery partner"
                    sx={{ minWidth: 220 }}
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                  >
                    {partners.map((p) => (
                      <MenuItem key={p.user.id} value={p.user.id}>
                        {p.user.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <LoadingButton variant="contained" loading={acting} disabled={!selectedPartner} onClick={handleAssign}>
                    Assign
                  </LoadingButton>
                </Stack>
              )}
            </CardContent>
          </Card>
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
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>{formatCurrency(order.total_amount)}</Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Customer & delivery
              </Typography>
              <Typography variant="body2">{order.customer?.name} · {order.customer?.email}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {order.contact_phone} · {order.full_address}
              </Typography>
              {order.delivery_partner && (
                <Typography variant="body2">Delivery partner: {order.delivery_partner.name}</Typography>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.label}
        requireReason
        loading={acting}
        onConfirm={(reason) => handleTransition(pendingAction, reason)}
        onClose={() => setPendingAction(null)}
      />
    </Grid>
  );
}
