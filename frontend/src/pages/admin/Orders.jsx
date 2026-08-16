import { Grid, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { orderService } from "../../services/orderService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";

const STATUSES = ["", "PLACED", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP",
  "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REJECTED"];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const load = () => {
    setStatus("loading");
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    orderService
      .list(params)
      .then(({ data }) => {
        setOrders(data.results);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, [filters]);

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Orders
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={4}>
          <TextField
            size="small"
            fullWidth
            label="Search order number"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            size="small"
            fullWidth
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s || "All"}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {status === "loading" && <SectionLoader />}
      {status === "failed" && <ErrorState message={error} onRetry={load} />}
      {status === "succeeded" && orders.length === 0 && <EmptyState title="No orders found" />}
      {status === "succeeded" && orders.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Shop</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/admin/orders/${order.id}`)}>
                <TableCell>{order.order_number}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>{order.shop_name}</TableCell>
                <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                <TableCell>
                  <StatusChip status={order.status} />
                </TableCell>
                <TableCell>
                  <StatusChip status={order.payment_status} type="payment" />
                </TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
