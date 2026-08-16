import DirectionsIcon from "@mui/icons-material/Directions";
import { LoadingButton } from "@mui/lab";
import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

const NEXT_STATUS = {
  ASSIGNED: { status: "ACCEPTED", label: "Accept delivery" },
  ACCEPTED: { status: "PICKED_UP", label: "Mark picked up" },
  PICKED_UP: { status: "OUT_FOR_DELIVERY", label: "Start delivery" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark delivered" },
};

function mapsLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function Active() {
  const [deliveries, setDeliveries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  const load = () => {
    setStatus("loading");
    deliveryService
      .myDeliveries({ active: "true" })
      .then(({ data }) => {
        setDeliveries(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  const handleAdvance = async (delivery) => {
    const next = NEXT_STATUS[delivery.status];
    if (!next) return;
    setActing(delivery.id);
    try {
      await deliveryService.transition(delivery.id, next.status);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActing(null);
    }
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;
  if (deliveries.length === 0) {
    return <EmptyState title="No active deliveries" subtitle="Assigned deliveries will show up here." />;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Active delivery
      </Typography>
      {deliveries.map((delivery) => {
        const order = delivery.order;
        const next = NEXT_STATUS[delivery.status];
        const destination =
          delivery.status === "ASSIGNED" || delivery.status === "ACCEPTED"
            ? { lat: order.shop.latitude, lng: order.shop.longitude, label: "Navigate to shop" }
            : { lat: order.latitude, lng: order.longitude, label: "Navigate to customer" };

        return (
          <Card key={delivery.id}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Stack>
                  <Typography fontWeight={600}>{order.order_number}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shop.name}
                  </Typography>
                </Stack>
                <StatusChip status={delivery.status} />
              </Stack>
              <Typography variant="body2">
                <strong>Pickup:</strong> {order.shop.full_address || order.shop.name}
              </Typography>
              <Typography variant="body2" mb={1}>
                <strong>Drop:</strong> {order.full_address}
              </Typography>
              <Typography fontWeight={600} mb={1.5}>
                {formatCurrency(order.total_amount)} · {order.payment_method}
                {order.payment_method === "COD" ? " (collect cash)" : ""}
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<DirectionsIcon />}
                  href={mapsLink(destination.lat, destination.lng)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {destination.label}
                </Button>
                {next && (
                  <LoadingButton variant="contained" loading={acting === delivery.id} onClick={() => handleAdvance(delivery)}>
                    {next.label}
                  </LoadingButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
