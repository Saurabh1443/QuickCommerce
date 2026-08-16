import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import HistoryIcon from "@mui/icons-material/History";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentsIcon from "@mui/icons-material/Payments";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { Alert, Snackbar } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";

import { getTokens } from "./services/api";
import { fetchCurrentUser, logout, selectRoleHome } from "./store/slices/authSlice";
import { hideSnackbar, loadLocationFromStorage, selectSnackbar } from "./store/slices/uiSlice";

import CustomerLayout from "./layouts/CustomerLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import PublicLayout from "./layouts/PublicLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

import CustomerRegisterPage from "./pages/auth/CustomerRegisterPage";
import DeliveryRegisterPage from "./pages/auth/DeliveryRegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import RoleSelectPage from "./pages/auth/RoleSelectPage";
import ShopkeeperRegisterPage from "./pages/auth/ShopkeeperRegisterPage";

import Addresses from "./pages/customer/Addresses";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Home from "./pages/customer/Home";
import CustomerOrderDetail from "./pages/customer/OrderDetail";
import CustomerOrders from "./pages/customer/Orders";
import Profile from "./pages/customer/Profile";
import ShopDetail from "./pages/customer/ShopDetail";
import Shops from "./pages/customer/Shops";

import ShopkeeperDashboard from "./pages/shopkeeper/Dashboard";
import Earnings from "./pages/shopkeeper/Earnings";
import ShopkeeperOrders from "./pages/shopkeeper/Orders";
import ProductForm from "./pages/shopkeeper/ProductForm";
import ShopkeeperProducts from "./pages/shopkeeper/Products";
import ShopProfile from "./pages/shopkeeper/ShopProfile";

import DeliveryActive from "./pages/delivery/Active";
import DeliveryAvailable from "./pages/delivery/Available";
import DeliveryDashboard from "./pages/delivery/Dashboard";
import DeliveryHistory from "./pages/delivery/History";
import DeliveryProfile from "./pages/delivery/Profile";

import AdminCategories from "./pages/admin/Categories";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDeliveryPartners from "./pages/admin/DeliveryPartners";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminOrders from "./pages/admin/Orders";
import AdminPayments from "./pages/admin/Payments";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminProducts from "./pages/admin/Products";
import AdminShopDetail from "./pages/admin/ShopDetail";
import AdminShops from "./pages/admin/Shops";
import AdminUsers from "./pages/admin/Users";

const shopkeeperMenu = [
  { to: "/shopkeeper/dashboard", label: "Dashboard", icon: <DashboardIcon />, end: true },
  { to: "/shopkeeper/orders", label: "Orders", icon: <ReceiptLongIcon /> },
  { to: "/shopkeeper/products", label: "Products", icon: <InventoryIcon /> },
  { to: "/shopkeeper/shop-profile", label: "Shop profile", icon: <StorefrontIcon /> },
  { to: "/shopkeeper/earnings", label: "Earnings", icon: <AssessmentIcon /> },
];

const deliveryMenu = [
  { to: "/delivery/dashboard", label: "Dashboard", icon: <DashboardIcon />, end: true },
  { to: "/delivery/available", label: "Available", icon: <LocalShippingIcon /> },
  { to: "/delivery/active", label: "Active delivery", icon: <DeliveryDiningIcon /> },
  { to: "/delivery/history", label: "History", icon: <HistoryIcon /> },
  { to: "/delivery/profile", label: "Profile", icon: <PersonIcon /> },
];

const adminMenu = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon />, end: true },
  { to: "/admin/users", label: "Users", icon: <PeopleIcon /> },
  { to: "/admin/shops", label: "Shops", icon: <StorefrontIcon /> },
  { to: "/admin/orders", label: "Orders", icon: <ReceiptLongIcon /> },
  { to: "/admin/products", label: "Products", icon: <InventoryIcon /> },
  { to: "/admin/delivery-partners", label: "Delivery partners", icon: <DeliveryDiningIcon /> },
  { to: "/admin/payments", label: "Payments", icon: <PaymentsIcon /> },
  { to: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
];

function RoleHomeRedirect() {
  const roleHome = useSelector(selectRoleHome);
  return <Navigate to={roleHome} replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const snackbar = useSelector(selectSnackbar);

  useEffect(() => {
    dispatch(loadLocationFromStorage());
    if (getTokens()?.access) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(logout());
    }

    const handleLogout = () => dispatch(logout());
    window.addEventListener("qc:logout", handleLogout);
    return () => window.removeEventListener("qc:logout", handleLogout);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RoleSelectPage />} />
          <Route path="/register/customer" element={<CustomerRegisterPage />} />
          <Route path="/register/shopkeeper" element={<ShopkeeperRegisterPage />} />
          <Route path="/register/delivery" element={<DeliveryRegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        <Route path="/home" element={<RoleHomeRedirect />} />

        {/* Customer */}
        <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
          <Route element={<CustomerLayout />}>
            <Route path="/customer" element={<Home />} />
            <Route path="/customer/shops" element={<Shops />} />
            <Route path="/customer/shop/:slug" element={<ShopDetail />} />
            <Route path="/customer/cart" element={<Cart />} />
            <Route path="/customer/checkout" element={<Checkout />} />
            <Route path="/customer/orders" element={<CustomerOrders />} />
            <Route path="/customer/orders/:id" element={<CustomerOrderDetail />} />
            <Route path="/customer/profile" element={<Profile />} />
            <Route path="/customer/addresses" element={<Addresses />} />
          </Route>
        </Route>

        {/* Shopkeeper */}
        <Route element={<ProtectedRoute roles={["SHOPKEEPER"]} />}>
          <Route element={<DashboardLayout title="Shopkeeper" menuItems={shopkeeperMenu} />}>
            <Route path="/shopkeeper/dashboard" element={<ShopkeeperDashboard />} />
            <Route path="/shopkeeper/orders" element={<ShopkeeperOrders />} />
            <Route path="/shopkeeper/products" element={<ShopkeeperProducts />} />
            <Route path="/shopkeeper/products/new" element={<ProductForm />} />
            <Route path="/shopkeeper/products/:id/edit" element={<ProductForm />} />
            <Route path="/shopkeeper/shop-profile" element={<ShopProfile />} />
            <Route path="/shopkeeper/earnings" element={<Earnings />} />
          </Route>
        </Route>

        {/* Delivery partner */}
        <Route element={<ProtectedRoute roles={["DELIVERY_PARTNER"]} />}>
          <Route element={<DashboardLayout title="Delivery partner" menuItems={deliveryMenu} />}>
            <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
            <Route path="/delivery/available" element={<DeliveryAvailable />} />
            <Route path="/delivery/active" element={<DeliveryActive />} />
            <Route path="/delivery/history" element={<DeliveryHistory />} />
            <Route path="/delivery/profile" element={<DeliveryProfile />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route element={<DashboardLayout title="Admin" menuItems={adminMenu} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/shops" element={<AdminShops />} />
            <Route path="/admin/shops/:id" element={<AdminShopDetail />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/admin/delivery-partners" element={<AdminDeliveryPartners />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => dispatch(hideSnackbar())}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} onClose={() => dispatch(hideSnackbar())} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </BrowserRouter>
  );
}
