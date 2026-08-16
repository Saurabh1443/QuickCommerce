import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import StarIcon from "@mui/icons-material/Star";
import { Box, Chip, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import ConfirmDialog from "../../components/ConfirmDialog";
import { EmptyState, ErrorState, SectionLoader } from "../../components/DataStates";
import ProductCard from "../../components/ProductCard";
import { extractErrorMessage } from "../../services/api";
import { productService } from "../../services/productService";
import { shopService } from "../../services/shopService";
import {
  addToCart,
  clearConflict,
  fetchCart,
  selectCart,
  selectCartConflict,
  updateCartItem,
} from "../../store/slices/cartSlice";
import { selectLocation } from "../../store/slices/uiSlice";

export default function ShopDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const location = useSelector(selectLocation);
  const cart = useSelector(selectCart);
  const conflict = useSelector(selectCartConflict);

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus("loading");
    const params = location ? { latitude: location.latitude, longitude: location.longitude } : {};
    Promise.all([shopService.detail(slug, params), productService.list({ shop: slug })])
      .then(([shopRes, productRes]) => {
        setShop(shopRes.data);
        setProducts(productRes.data.results || productRes.data);
        setStatus("succeeded");
      })
      .catch((err) => {
        setError(extractErrorMessage(err));
        setStatus("failed");
      });
  }, [slug, location]);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.category, p.category_name));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [products]);

  const visibleProducts =
    activeCategory === "all" ? products : products.filter((p) => p.category === activeCategory);

  const quantityFor = (productId) => {
    const item = cart?.items?.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  const itemIdFor = (productId) => cart?.items?.find((i) => i.product.id === productId)?.id;

  const handleAdd = async (productId) => {
    const result = await dispatch(addToCart({ productId, quantity: 1 }));
    if (!result.error) dispatch(fetchCart());
  };

  const handleIncrement = async (product) => {
    const itemId = itemIdFor(product.id);
    if (itemId) await dispatch(updateCartItem({ itemId, quantity: quantityFor(product.id) + 1 }));
  };

  const handleDecrement = async (product) => {
    const itemId = itemIdFor(product.id);
    if (itemId) await dispatch(updateCartItem({ itemId, quantity: quantityFor(product.id) - 1 }));
  };

  const handleReplaceCart = async () => {
    if (!conflict) return;
    await dispatch(addToCart({ ...conflict, replaceCart: true }));
    dispatch(clearConflict());
  };

  if (status === "loading") return <SectionLoader height={400} />;
  if (status === "failed") return <ErrorState message={error} />;
  if (!shop) return <EmptyState title="Shop not found" />;

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          height: 180,
          borderRadius: 3,
          bgcolor: "grey.200",
          backgroundImage: shop.image ? `url(${shop.image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {shop.name}
        </Typography>
        <Typography color="text.secondary">{shop.category_name}</Typography>
        <Stack direction="row" spacing={2} alignItems="center" mt={1} flexWrap="wrap">
          <Chip icon={<StarIcon sx={{ fontSize: 16 }} />} label={Number(shop.rating).toFixed(1)} color="success" />
          {shop.distance_km != null && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PlaceIcon fontSize="small" color="action" />
              <Typography variant="body2">{shop.distance_km} km away</Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2">
              {shop.eta_minutes?.min}-{shop.eta_minutes?.max} min · Open {shop.opening_time?.slice(0, 5)}-
              {shop.closing_time?.slice(0, 5)}
            </Typography>
          </Stack>
          <Chip label={shop.is_open_now ? "Open now" : "Closed"} color={shop.is_open_now ? "success" : "default"} size="small" />
        </Stack>
        {shop.description && (
          <Typography color="text.secondary" mt={1}>
            {shop.description}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" mt={1}>
          {shop.full_address}
        </Typography>
      </Box>

      <Tabs
        value={activeCategory}
        onChange={(_, value) => setActiveCategory(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="All" value="all" />
        {categories.map((c) => (
          <Tab key={c.id} label={c.name} value={c.id} />
        ))}
      </Tabs>

      {visibleProducts.length === 0 ? (
        <EmptyState title="No products in this category yet" />
      ) : (
        <Grid container spacing={2}>
          {visibleProducts.map((product) => (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <ProductCard
                product={product}
                quantity={quantityFor(product.id)}
                onAdd={() => handleAdd(product.id)}
                onIncrement={() => handleIncrement(product)}
                onDecrement={() => handleDecrement(product)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ConfirmDialog
        open={Boolean(conflict)}
        title="Start a new cart?"
        description="Your cart contains products from another shop. Clear the existing cart and add this product instead?"
        confirmLabel="Clear cart & add"
        onConfirm={handleReplaceCart}
        onClose={() => dispatch(clearConflict())}
      />
    </Stack>
  );
}
