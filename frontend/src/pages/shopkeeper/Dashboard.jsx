import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { ErrorState, SectionLoader } from "../../components/DataStates";
import { dashboardService } from "../../services/dashboardService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

function StatCard({ label, value }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} mt={0.5}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function ShopkeeperDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardService
      .shopkeeper()
      .then(({ data }) => {
        setStats(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, []);

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} />;

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={700}>
        Dashboard
      </Typography>
      {stats.shop_status !== "APPROVED" && (
        <Card sx={{ bgcolor: "warning.light" }}>
          <CardContent>
            <Typography fontWeight={600}>Shop status: {stats.shop_status}</Typography>
            <Typography variant="body2">
              Your shop must be approved by an administrator before it appears to customers.
            </Typography>
          </CardContent>
        </Card>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's orders" value={stats.today_orders} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's sales" value={formatCurrency(stats.today_sales)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Pending orders" value={stats.pending_orders} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Total products" value={stats.total_products} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Low stock items" value={stats.low_stock_products} />
        </Grid>
      </Grid>
    </Stack>
  );
}
