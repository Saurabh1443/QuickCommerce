import { Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { paymentService } from "../../services/paymentService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    paymentService
      .adminList()
      .then(({ data }) => {
        setPayments(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, []);

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} />;
  if (payments.length === 0) return <EmptyState title="No payments yet" />;

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>
        Payments
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Gateway</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.order_number}</TableCell>
              <TableCell>{payment.gateway}</TableCell>
              <TableCell>{payment.method}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                <StatusChip status={payment.status} type="payment" />
              </TableCell>
              <TableCell>{formatDate(payment.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
