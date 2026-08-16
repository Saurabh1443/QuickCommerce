import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { logout, selectAuthUser } from "../store/slices/authSlice";

const DRAWER_WIDTH = 250;

export default function DashboardLayout({ title, menuItems }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Toolbar>
        <Typography variant="h6" fontWeight={700} color="primary.main">
          QuickCommerce
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            sx={{
              "&.active": {
                bgcolor: "primary.main",
                color: "#fff",
                "& .MuiListItemIcon-root": { color: "#fff" },
              },
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <List>
        <ListItemButton onClick={handleLogout} sx={{ mx: 1, borderRadius: 2 }}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box display="flex" minHeight="100vh">
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", borderRight: "1px solid #eee" },
        }}
        open
      >
        {drawerContent}
      </Drawer>
      <Box flexGrow={1} display="flex" flexDirection="column" minWidth={0}>
        <AppBar
          position="sticky"
          color="default"
          sx={{ bgcolor: "background.paper", display: { md: "none" } }}
        >
          <Toolbar>
            <IconButton onClick={() => setMobileOpen(true)} edge="start" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" flexGrow={1}>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>
        <AppBar
          position="sticky"
          color="default"
          sx={{ bgcolor: "background.paper", display: { xs: "none", md: "block" } }}
        >
          <Toolbar>
            <Typography variant="h6" flexGrow={1}>
              {title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                {user?.name} · {user?.role?.replace("_", " ")}
              </Typography>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box flexGrow={1} p={{ xs: 2, md: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
