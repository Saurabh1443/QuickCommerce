import {
  Chip,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from 'use-debounce';

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import { dashboardService } from "../../services/dashboardService";
import { extractErrorMessage } from "../../services/api";
import { formatDate } from "../../utils/format";

const ROLES = ["All roles", "CUSTOMER", "SHOPKEEPER", "DELIVERY_PARTNER", "ADMIN"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

const load = useDebouncedCallback(() => {
  dashboardService
    .adminUsers({
      ...(role!="All roles" ? { role } : {}),
      ...(search ? { search } : {}),
    })
    .then(({ data }) => {
      setUsers(data);
      setStatus("succeeded");
    })
    .catch((err) => {
      setError(extractErrorMessage(err));
      setStatus("failed");
    });
}, 500);

  useEffect(load, [role, search]);

  const handleToggle = async (user) => {
    await dashboardService.adminUserAction(user.id, user.is_active ? "deactivate" : "activate");
    load();
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight={700}>
          Users
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <TextField size="small" placeholder="Search name/email/phone" value={search} onChange={(e) => {setStatus("loading");setSearch(e.target.value)}} />
          <TextField select size="small" label="Role" sx={{ minWidth: 160 }} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>

      {status === "loading" && <SectionLoader message="loading users..." />}
      {status === "failed" && <ErrorState message={error} onRetry={load} />}
      {status === "succeeded" && users.length === 0 && <EmptyState title="No users found" />}
      {status === "succeeded" && users.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Active</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <Chip size="small" label={user.role.replace("_", " ")} />
                </TableCell>
                <TableCell>{formatDate(user.date_joined)}</TableCell>
                <TableCell align="right">
                  <Switch checked={user.is_active} onChange={() => handleToggle(user)} disabled={user.role === "ADMIN"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
