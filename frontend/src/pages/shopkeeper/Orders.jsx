import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

import ConfirmDialog from "../../components/ConfirmDialog";
import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { extractErrorMessage } from "../../services/api";
import { orderService } from "../../services/orderService";
import { formatCurrency, formatDate } from "../../utils/format";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "PLACED", label: "New" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY_FOR_PICKUP", label: "Ready for pickup" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function ShopkeeperOrders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    setStatus("loading");
    orderService
      .list(filter ? { status: filter } : {})
      .then(({ data }) => {
        setOrders(data.results);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, [filter]);

  const openOrder = (id) => {
    setActionError(null);
    orderService.detail(id).then(({ data }) => setSelected(data));
  };

  const handleAction = async (action, note = "") => {
    setActing(true);
    setActionError(null);
    try {
      await orderService.transition(selected.id, action.status, note);
      setPendingAction(null);
      openOrder(selected.id);
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>
          Orders
        </Typography>
        <TextField select size="small" label="Status" sx={{ minWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUS_FILTERS.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {status === "loading" && <SectionLoader />}
      {status === "failed" && <ErrorState message={error} onRetry={load} />}
      {status === "succeeded" && orders.length === 0 && <EmptyState title="No orders found" />}
      {status === "succeeded" &&
        orders.map((order) => (
          <Card key={order.id} sx={{ cursor: "pointer" }} onClick={() => openOrder(order.id)}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                <Stack>
                  <Typography fontWeight={600}>{order.order_number}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer_name} · {formatDate(order.created_at)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={600}>{formatCurrency(order.total_amount)}</Typography>
                  <StatusChip status={order.status} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} fullWidth maxWidth="sm">
        {selected && (
          <>
            <DialogTitle>{selected.order_number}</DialogTitle>
            <DialogContent>
              {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
              <Typography fontWeight={600}>{selected.customer?.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {selected.contact_phone} · {selected.full_address}
              </Typography>
              <StatusChip status={selected.status} />
              <Stack spacing={0.5} mt={2}>
                {selected.items.map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between">
                    <Typography variant="body2">
                      {item.product_name} × {item.quantity}
                    </Typography>
                    <Typography variant="body2">{formatCurrency(item.total_price)}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography fontWeight={700} mt={1.5}>
                Total: {formatCurrency(selected.total_amount)} ({selected.payment_method}
                {selected.payment_status === "PAID" ? ", paid" : ", pending"})
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
              {selected.available_actions.map((action) => (
                <LoadingButton
                  key={action.status}
                  variant={action.status === "CANCELLED" ? "outlined" : "contained"}
                  color={action.status === "CANCELLED" ? "error" : "primary"}
                  loading={acting}
                  onClick={() => (action.reason_required ? setPendingAction(action) : handleAction(action))}
                >
                  {action.label}
                </LoadingButton>
              ))}
            </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.label}
        requireReason
        loading={acting}
        onConfirm={(reason) => handleAction(pendingAction, reason)}
        onClose={() => setPendingAction(null)}
      />
    </Stack>
  );
}
