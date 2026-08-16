import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import {
  Avatar,
  Button,
  Chip,
  IconButton,
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
import { useNavigate } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog";
import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import { extractErrorMessage } from "../../services/api";
import { productService } from "../../services/productService";
import { formatCurrency } from "../../utils/format";

export default function ShopkeeperProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);

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

  const handleStockChange = async (product, value) => {
    const stock_quantity = Math.max(0, parseInt(value, 10) || 0);
    await productService.updateStock(product.id, stock_quantity);
    load();
  };

  const handleToggle = async (product) => {
    await productService.toggleAvailability(product.id);
    load();
  };

  const handleDelete = async () => {
    await productService.remove(toDelete.id);
    setToDelete(null);
    load();
  };

  if (status === "loading") return <SectionLoader height={300} />;
  if (status === "failed") return <ErrorState message={error} onRetry={load} />;

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" fontWeight={700}>
          Products
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/shopkeeper/products/new")}>
          Add product
        </Button>
      </Stack>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          subtitle="Add your first product to start selling."
          action={
            <Button variant="contained" onClick={() => navigate("/shopkeeper/products/new")}>
              Add product
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Available</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar variant="rounded" src={product.image || undefined} />
                    <Stack>
                      <Typography fontWeight={600}>{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.unit}
                      </Typography>
                    </Stack>
                    {product.is_low_stock && <Chip label="Low stock" size="small" color="warning" />}
                  </Stack>
                </TableCell>
                <TableCell>{product.category_name}</TableCell>
                <TableCell>
                  {formatCurrency(product.effective_price)}
                  {product.discount_percent > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      MRP {formatCurrency(product.price)}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    defaultValue={product.stock_quantity}
                    onBlur={(e) => handleStockChange(product, e.target.value)}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  <Switch checked={product.is_available} onChange={() => handleToggle(product)} />
                </TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => navigate(`/shopkeeper/products/${product.id}/edit`)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => setToDelete(product)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.name}"?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Stack>
  );
}
