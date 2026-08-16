import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { SectionLoader } from "../components/DataStates";
import {
  selectAuthBootstrapped,
  selectAuthUser,
  selectIsAuthenticated,
} from "../store/slices/authSlice";

/** Frontend-side gate only; the backend re-checks every role/ownership rule itself. */
export default function ProtectedRoute({ roles }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapped = useSelector(selectAuthBootstrapped);
  const user = useSelector(selectAuthUser);
  const location = useLocation();

  if (!bootstrapped) return <SectionLoader height="100vh" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
