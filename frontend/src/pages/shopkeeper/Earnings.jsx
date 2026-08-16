import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import { ErrorState, SectionLoader } from "../../components/DataStates";
import { dashboardService } from "../../services/dashboardService";
import { extractErrorMessage } from "../../services/api";
import { formatCurrency } from "../../utils/format";

export default function Earnings() {
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
        Earnings
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Today's sales (paid orders)</Typography>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {formatCurrency(stats.today_sales)}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                from {stats.today_orders} order(s) today
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Pending orders</Typography>
              <Typography variant="h3" fontWeight={700}>
                {stats.pending_orders}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Orders awaiting action
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
