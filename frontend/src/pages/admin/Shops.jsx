import { MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import StatusChip from "../../components/StatusChip";
import { shopService } from "../../services/shopService";
import { extractErrorMessage } from "../../services/api";

const STATUSES = ["", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export default function AdminShops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const load = () => {
    setStatus("loading");
    shopService
      .adminList(statusFilter ? { status: statusFilter } : {})
      .then(({ data }) => {
        setShops(data.results || data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, [statusFilter]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Shops
        </Typography>
        <TextField
          select
          size="small"
          label="Status"
          sx={{ minWidth: 180 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s || "All"}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {status === "loading" && <SectionLoader />}
      {status === "failed" && <ErrorState message={error} onRetry={load} />}
      {status === "succeeded" && shops.length === 0 && <EmptyState title="No shops found" />}
      {status === "succeeded" && shops.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shops.map((shop) => (
              <TableRow key={shop.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/admin/shops/${shop.id}`)}>
                <TableCell>{shop.name}</TableCell>
                <TableCell>{shop.owner?.name}</TableCell>
                <TableCell>{shop.city}</TableCell>
                <TableCell>
                  <StatusChip status={shop.status} type="shop" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
