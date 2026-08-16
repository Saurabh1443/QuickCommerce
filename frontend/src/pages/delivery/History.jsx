import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";

export default function History() {
  const [deliveries, setDeliveries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    deliveryService
      .myDeliveries()
      .then(({ data }) => {
        setDeliveries(data.filter((d) => ["DELIVERED", "CANCELLED"].includes(d.status)));
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, []);

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} />;
  if (deliveries.length === 0) return <EmptyState title="No completed deliveries yet" />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Delivery history
      </Typography>
      {deliveries.map((delivery) => (
        <Card key={delivery.id}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack>
                <Typography fontWeight={600}>{delivery.order.order_number}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {delivery.order.shop.name} · {formatDate(delivery.delivery_time || delivery.created_at)}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={600}>{formatCurrency(delivery.order.total_amount)}</Typography>
                <StatusChip status={delivery.status} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
