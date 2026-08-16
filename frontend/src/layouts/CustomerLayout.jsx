import LocationOnIcon from "@mui/icons-material/LocationOn";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, Outlet, useNavigate } from "react-router-dom";

import LocationDialog from "../components/LocationDialog";
import { fetchCart, selectCartItemCount } from "../store/slices/cartSlice";
import { logout, selectAuthUser } from "../store/slices/authSlice";
import { selectLocation } from "../store/slices/uiSlice";

export default function CustomerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const cartCount = useSelector(selectCartItemCount);
  const location = useSelector(selectLocation);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/customer/shops?search=${encodeURIComponent(search)}`);
  };

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AppBar position="sticky" color="default" sx={{ bgcolor: "background.paper" }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/customer"
            sx={{ color: "primary.main", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
          >
            QuickCommerce
          </Typography>

          <Button
            startIcon={<LocationOnIcon />}
            onClick={() => setLocationOpen(true)}
            sx={{ textAlign: "left", maxWidth: 220 }}
          >
            <Box>
              <Typography variant="caption" display="block" color="text.secondary" lineHeight={1}>
                Deliver to
              </Typography>
              <Typography variant="body2" fontWeight={600} noWrap>
                {location?.label || "Select location"}
              </Typography>
            </Box>
          </Button>

          <Box component="form" onSubmit={handleSearch} flexGrow={1} maxWidth={480}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search for products, shops, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box flexGrow={1} />

          <IconButton onClick={() => navigate("/customer/orders")} title="My orders">
            <ReceiptLongIcon />
          </IconButton>
          <IconButton onClick={() => navigate("/customer/cart")} title="Cart">
            <Badge badgeContent={cartCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <PersonIcon />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem sx={{ pointerEvents: "none" }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.name}
              </Typography>
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate("/customer/profile");
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                navigate("/customer/addresses");
              }}
            >
              Addresses
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                dispatch(logout());
                navigate("/login");
              }}
            >
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 3 }}>
        <Outlet />
      </Container>
      <LocationDialog open={locationOpen} onClose={() => setLocationOpen(false)} />
    </Box>
  );
}
