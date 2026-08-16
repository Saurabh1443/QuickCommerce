import { Button, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import { deliveryService } from "../../services/deliveryService";
import { extractErrorMessage } from "../../services/api";

export default function AdminDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const load = () => {
    setStatus("loading");
    deliveryService
      .adminPartners()
      .then(({ data }) => {
        setPartners(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  const handleAction = async (partner, action) => {
    await deliveryService.adminPartnerAction(partner.id, action);
    load();
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;
  if (partners.length === 0) return <EmptyState title="No delivery partners yet" />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Delivery partners
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Online</TableCell>
            <TableCell>Deliveries</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {partners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell>
                <Typography fontWeight={600}>{partner.user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {partner.user.phone}
                </Typography>
              </TableCell>
              <TableCell>
                {partner.vehicle_type} {partner.vehicle_number}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={partner.is_approved ? "Approved" : "Pending"}
                  color={partner.is_approved ? "success" : "warning"}
                />
              </TableCell>
              <TableCell>
                <Chip size="small" label={partner.is_online ? "Online" : "Offline"} color={partner.is_online ? "primary" : "default"} />
              </TableCell>
              <TableCell>{partner.total_deliveries}</TableCell>
              <TableCell align="right">
                {!partner.is_approved ? (
                  <Button size="small" variant="contained" onClick={() => handleAction(partner, "approve")}>
                    Approve
                  </Button>
                ) : (
                  <Button size="small" color="error" onClick={() => handleAction(partner, "deactivate")}>
                    Deactivate
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
