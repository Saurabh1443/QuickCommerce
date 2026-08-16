import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { extractErrorMessage } from "../../services/api";
import { orderService } from "../../services/orderService";
import { formatCurrency, formatDate } from "../../utils/format";

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    orderService
      .list()
      .then(({ data }) => {
        setOrders(data.results);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, []);

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} />;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" subtitle="Your placed orders will show up here." />;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        My orders
      </Typography>
      {orders.map((order) => (
        <Card key={order.id} sx={{ cursor: "pointer" }} onClick={() => navigate(`/customer/orders/${order.id}`)}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Stack>
                <Typography fontWeight={600}>{order.order_number}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.shop_name} · {formatDate(order.created_at)}
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
    </Stack>
  );
}
