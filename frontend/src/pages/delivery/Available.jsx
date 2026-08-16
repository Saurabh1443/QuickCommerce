import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

export default function Available() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [note, setNote] = useState("");

  const load = () => {
    setStatus("loading");
    deliveryService
      .availableOrders()
      .then(({ data }) => {
        setOrders(data.results || data);
        setNote(data.detail || "");
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Ready for pickup
      </Typography>
      <Typography variant="body2" color="text.secondary">
        An administrator assigns deliveries to partners. These are orders currently awaiting
        assignment near you.
      </Typography>
      {note && <Typography color="warning.main">{note}</Typography>}
      {orders.length === 0 ? (
        <EmptyState title="Nothing to pick up right now" subtitle="Check back soon." />
      ) : (
        orders.map((order) => (
          <Card key={order.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Stack>
                  <Typography fontWeight={600}>{order.order_number}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shop_name}
                  </Typography>
                </Stack>
                <Typography fontWeight={600}>{formatCurrency(order.total_amount)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}
    </Stack>
  );
}
