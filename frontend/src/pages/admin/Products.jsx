import AddIcon from "@mui/icons-material/Add";
import {
  Avatar,
  Button,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import { extractErrorMessage } from "../../services/api";
import { productService } from "../../services/productService";
import { formatCurrency } from "../../utils/format";

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const load = () => {
    setStatus("loading");
    productService
      .manageList()
      .then(({ data }) => {
        setProducts(data.results);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  };

  useEffect(load, []);

  const handleToggle = async (product) => {
    await productService.toggleAvailability(product.id);
    load();
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          All products
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/admin/products/new")}>
          Add product
        </Button>
      </Stack>
      {products.length === 0 ? (
        <EmptyState title="No products yet" />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Shop</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell align="right">Available</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar variant="rounded" src={product.image || undefined} />
                    <Typography fontWeight={600}>{product.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{product.shop_name}</TableCell>
                <TableCell>{formatCurrency(product.effective_price)}</TableCell>
                <TableCell>{product.stock_quantity}</TableCell>
                <TableCell align="right">
                  <Switch checked={product.is_available} onChange={() => handleToggle(product)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
