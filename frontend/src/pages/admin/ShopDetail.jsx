import { LoadingButton } from "@mui/lab";
import { Card, CardContent, Divider, Grid, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog";
import { ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { shopService } from "../../services/shopService";
import { extractErrorMessage } from "../../services/api";

export default function AdminShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [acting, setActing] = useState(false);

  const load = () => {
    setStatus("loading");
    shopService
      .adminDetail(id)
      .then(({ data }) => {
        setShop(data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, [id]);

  const handleAction = async (reason = "") => {
    setActing(true);
    try {
      if (pendingAction === "approve") await shopService.approve(id, reason);
      if (pendingAction === "reject") await shopService.reject(id, reason);
      if (pendingAction === "suspend") await shopService.suspend(id, reason);
      setPendingAction(null);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setActing(false);
    }
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;
  if (!shop) return null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight={700}>
                {shop.name}
              </Typography>
              <StatusChip status={shop.status} type="shop" />
            </Stack>
            <Typography color="text.secondary">{shop.category_detail?.name}</Typography>
            <Typography mt={1}>{shop.description}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary.main">
              Owner
            </Typography>
            <Typography>{shop.owner?.name} · {shop.owner?.phone} · {shop.owner?.email}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="primary.main">
              Location
            </Typography>
            <Typography>{shop.full_address}</Typography>
            <Typography variant="body2" color="text.secondary">
              Lat/Lng: {shop.latitude}, {shop.longitude}
            </Typography>
            {shop.status_reason && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="error.main">
                  Reason
                </Typography>
                <Typography>{shop.status_reason}</Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Business / KYC
              </Typography>
              <Typography variant="body2">GST: {shop.kyc?.gst_number || "—"}</Typography>
              <Typography variant="body2">PAN: {shop.kyc?.pan_number || "—"}</Typography>
              <Typography variant="body2">Bank account: {shop.kyc?.bank_account_number || "—"}</Typography>
              <Typography variant="body2">IFSC: {shop.kyc?.bank_ifsc || "—"}</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                Actions
              </Typography>
              <Stack spacing={1.5}>
                {shop.status !== "APPROVED" && (
                  <LoadingButton variant="contained" color="success" onClick={() => setPendingAction("approve")}>
                    Approve shop
                  </LoadingButton>
                )}
                {shop.status !== "REJECTED" && (
                  <LoadingButton variant="outlined" color="error" onClick={() => setPendingAction("reject")}>
                    Reject shop
                  </LoadingButton>
                )}
                {shop.status === "APPROVED" && (
                  <LoadingButton variant="outlined" color="warning" onClick={() => setPendingAction("suspend")}>
                    Suspend shop
                  </LoadingButton>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction === "approve" ? "Approve this shop?" : `${pendingAction} this shop?`}
        requireReason={pendingAction !== "approve"}
        confirmLabel={pendingAction}
        confirmColor={pendingAction === "approve" ? "success" : "error"}
        loading={acting}
        onConfirm={handleAction}
        onClose={() => setPendingAction(null)}
      />
    </Grid>
  );
}
