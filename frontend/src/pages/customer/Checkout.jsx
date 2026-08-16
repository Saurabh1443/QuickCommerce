import AddIcon from "@mui/icons-material/Add";
import { LoadingButton } from "@mui/lab";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { EmptyState, SectionLoader } from "../../components/DataStates";
import MapPicker from "../../components/MapPicker";
import { addressService } from "../../services/addressService";
import { extractErrorMessage } from "../../services/api";
import { orderService } from "../../services/orderService";
import { paymentService } from "../../services/paymentService";
import { RAZORPAY_KEY_ID } from "../../utils/constants";
import { formatCurrency } from "../../utils/format";
import { loadRazorpay } from "../../utils/razorpay";
import { fetchCart, selectCart } from "../../store/slices/cartSlice";
import { selectAuthUser } from "../../store/slices/authSlice";
import { showSnackbar } from "../../store/slices/uiSlice";

const emptyAddress = {
  name: "", phone: "", address_line: "", landmark: "", city: "", state: "", pincode: "",
};

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const cart = useSelector(selectCart);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newAddress, setNewAddress] = useState(emptyAddress);
  const [newPoint, setNewPoint] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    dispatch(fetchCart());
    addressService
      .list()
      .then(({ data }) => {
        setAddresses(data);
        const defaultAddress = data.find((a) => a.is_default) || data[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleSaveAddress = async () => {
    if (!newPoint?.lat) {
      setError("Please pick the delivery location on the map.");
      return;
    }
    setSavingAddress(true);
    try {
      const { data } = await addressService.create({
        ...newAddress,
        latitude: Number(newPoint.lat.toFixed(6)),
      longitude: Number(newPoint.lng.toFixed(6)),
      });
      setAddresses((prev) => [data, ...prev]);
      setSelectedAddressId(data.id);
      setAddOpen(false);
      setNewAddress(emptyAddress);
      setNewPoint(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError("Please select or add a delivery address.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const { data: order } = await orderService.place({
        address: { address_id: selectedAddressId },
        payment_method: paymentMethod,
      });
      // The backend clears the cart as soon as the order is created (any payment
      // method); re-sync Redux immediately so the header's cart badge doesn't go stale.
      dispatch(fetchCart());

      if (paymentMethod === "COD") {
        dispatch(showSnackbar({ message: "Order placed successfully!", severity: "success" }));
        navigate(`/customer/orders/${order.id}`);
        return;
      }

      const { data: initiation } = await paymentService.initiate(order.id);
      const checkout = initiation.checkout;

      if (checkout.sandbox) {
        // No Razorpay keys are configured on the backend, so there is no real gateway
        // order to open a checkout widget for. Auto-verify against the sandbox order
        // the backend fabricated, so the whole flow stays testable end-to-end.
        await paymentService.verify({
          order_id: order.id,
          razorpay_order_id: checkout.gateway_order_id,
          razorpay_payment_id: `sandbox_pay_${Date.now()}`,
          razorpay_signature: "",
        });
        dispatch(
          showSnackbar({
            message: "Sandbox payment auto-verified (no Razorpay keys configured).",
            severity: "info",
          })
        );
        navigate(`/customer/orders/${order.id}`);
        return;
      }

      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: checkout.key_id || RAZORPAY_KEY_ID,
        amount: Math.round(Number(checkout.amount) * 100),
        currency: checkout.currency,
        order_id: checkout.gateway_order_id,
        name: "QuickCommerce",
        description: `Order ${order.order_number}`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        handler: async (response) => {
          try {
            await paymentService.verify({
              order_id: order.id,
              razorpay_order_id: checkout.gateway_order_id,
              razorpay_payment_id: response.razorpay_payment_id || `sandbox_pay_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || "",
            });
            dispatch(showSnackbar({ message: "Payment successful! Order placed.", severity: "success" }));
          } catch (err) {
            dispatch(showSnackbar({ message: extractErrorMessage(err), severity: "error" }));
          } finally {
            navigate(`/customer/orders/${order.id}`);
          }
        },
        modal: {
          ondismiss: () => navigate(`/customer/orders/${order.id}`),
        },
        theme: { color: "#0F766E" },
      });

      rzp.open();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <SectionLoader height={300} />;
  if (!cart?.items?.length) {
    return <EmptyState title="Your cart is empty" subtitle="Add products before checking out." />;
  }

  const totals = cart.totals;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="h6">Delivery address</Typography>
                <Button startIcon={<AddIcon />} size="small" onClick={() => setAddOpen(true)}>
                  Add new
                </Button>
              </Stack>
              {addresses.length === 0 ? (
                <Typography color="text.secondary">No saved addresses. Add one to continue.</Typography>
              ) : (
                <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(Number(e.target.value))}>
                  {addresses.map((address) => (
                    <FormControlLabel
                      key={address.id}
                      value={address.id}
                      control={<Radio />}
                      sx={{ alignItems: "flex-start", mb: 1 }}
                      label={
                        <Stack>
                          <Typography fontWeight={600}>
                            {address.name} · {address.phone}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {address.full_address}
                          </Typography>
                        </Stack>
                      }
                    />
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={1.5}>
                Payment
              </Typography>
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <FormControlLabel value="ONLINE" control={<Radio />} label="Pay online (Razorpay — cards, UPI, wallets)" />
                {cart.shop?.cod_enabled && (
                  <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery" />
                )}
              </RadioGroup>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={1.5}>
              Order summary
            </Typography>
            <Stack spacing={0.75} mb={1.5}>
              {cart.items.map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">
                    {item.product.name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2">{formatCurrency(item.total_price)}</Typography>
                </Stack>
              ))}
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={0.75}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>{formatCurrency(totals.subtotal)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Delivery fee</Typography>
                <Typography>{formatCurrency(totals.delivery_fee)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={700}>{formatCurrency(totals.total)}</Typography>
              </Stack>
            </Stack>
            <LoadingButton
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              loading={placing}
              onClick={handlePlaceOrder}
            >
              {paymentMethod === "COD" ? "Place order" : `Pay ${formatCurrency(totals.total)}`}
            </LoadingButton>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add delivery address</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={newAddress.name}
                onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              />
              <TextField
                label="Phone"
                fullWidth
                value={newAddress.phone}
                onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              />
            </Stack>
            <TextField
              label="Address line"
              fullWidth
              value={newAddress.address_line}
              onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
            />
            <TextField
              label="Landmark (optional)"
              fullWidth
              value={newAddress.landmark}
              onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                fullWidth
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              />
              <TextField
                label="State"
                fullWidth
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
              />
              <TextField
                label="Pincode"
                fullWidth
                value={newAddress.pincode}
                onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
              />
            </Stack>
            <MapPicker value={newPoint} onChange={setNewPoint} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" loading={savingAddress} onClick={handleSaveAddress}>
            Save address
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
