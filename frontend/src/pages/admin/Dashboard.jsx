import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { ErrorState, SectionLoader } from "../../components/DataStates";
import { dashboardService } from "../../services/dashboardService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

function StatCard({ label, value, color }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} mt={0.5} color={color}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardService
      .admin()
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
        Platform overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Total customers" value={stats.total_customers} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Total shops" value={stats.total_shops} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Pending shop approvals" value={stats.pending_shop_approvals} color="warning.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Total orders" value={stats.total_orders} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's orders" value={stats.todays_orders} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's revenue" value={formatCurrency(stats.todays_revenue)} color="primary.main" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Active delivery partners" value={stats.active_delivery_partners} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Pending partner approvals" value={stats.pending_delivery_approvals} color="warning.main" />
        </Grid>
      </Grid>
    </Stack>
  );
}
