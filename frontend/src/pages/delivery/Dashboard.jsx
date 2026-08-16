import { Card, CardContent, FormControlLabel, Grid, Stack, Switch, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { ErrorState, SectionLoader } from "../../components/DataStates";
import { dashboardService } from "../../services/dashboardService";
import { deliveryService } from "../../services/deliveryService";
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

export default function DeliveryDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

  const load = () => {
    setStatus("loading");
    dashboardService
      .delivery()
      .then(({ data }) => {
        setStats(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  const handleToggleOnline = async (e) => {
    setToggling(true);
    try {
      await deliveryService.setAvailability({ is_online: e.target.checked });
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setToggling(false);
    }
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Dashboard
        </Typography>
        <FormControlLabel
          control={<Switch checked={stats.is_online} onChange={handleToggleOnline} disabled={toggling || !stats.is_approved} />}
          label={stats.is_online ? "Online" : "Offline"}
        />
      </Stack>
      {!stats.is_approved && (
        <Card sx={{ bgcolor: "warning.light" }}>
          <CardContent>
            <Typography fontWeight={600}>Account pending approval</Typography>
            <Typography variant="body2">
              An administrator needs to approve your account before you can go online.
            </Typography>
          </CardContent>
        </Card>
      )}
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's deliveries" value={stats.today_deliveries} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Today's earnings" value={formatCurrency(stats.today_earnings)} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Active deliveries" value={stats.active_deliveries} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard label="Total deliveries" value={stats.total_deliveries} />
        </Grid>
      </Grid>
    </Stack>
  );
}
