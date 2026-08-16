import MyLocationIcon from "@mui/icons-material/MyLocation";
import { Alert, Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useState } from "react";

import { DEFAULT_MAP_CENTER, GOOGLE_MAPS_API_KEY } from "../utils/constants";

const containerStyle = { width: "100%", height: "280px", borderRadius: 12 };

/**
 * Click-to-pick location map backed by the Google Maps JavaScript API.
 * Falls back to a manual latitude/longitude form when no API key is configured,
 * so the checkout/shop-onboarding flows keep working in local development.
 */
export default function MapPicker({ value, onChange }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: "quickcommerce-google-maps",
  });
  const [manualLat, setManualLat] = useState(value?.lat ?? "");
  const [manualLng, setManualLng] = useState(value?.lng ?? "");

  const center = value?.lat ? value : DEFAULT_MAP_CENTER;

  const handleMapClick = useCallback(
    (event) => {
      onChange({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    },
    [onChange]
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!GOOGLE_MAPS_API_KEY || loadError) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Google Maps isn't configured (set <code>VITE_GOOGLE_MAPS_API_KEY</code>). Enter
          coordinates manually or use your current location.
        </Alert>
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Latitude"
            type="number"
            value={manualLat}
            onChange={(e) => {
              setManualLat(e.target.value);
              onChange({ lat: parseFloat(e.target.value), lng: parseFloat(manualLng) || 0 });
            }}
            fullWidth
          />
          <TextField
            label="Longitude"
            type="number"
            value={manualLng}
            onChange={(e) => {
              setManualLng(e.target.value);
              onChange({ lat: parseFloat(manualLat) || 0, lng: parseFloat(e.target.value) });
            }}
            fullWidth
          />
          <Tooltip title="Use current location">
            <IconButton color="primary" onClick={useCurrentLocation}>
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    );
  }

  if (!isLoaded) {
    return <Typography color="text.secondary">Loading map...</Typography>;
  }

  return (
    <Box position="relative">
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14} onClick={handleMapClick}>
        {value?.lat && <Marker position={value} />}
      </GoogleMap>
      <Tooltip title="Use current location">
        <IconButton
          onClick={useCurrentLocation}
          sx={{ position: "absolute", top: 8, right: 8, bgcolor: "background.paper" }}
        >
          <MyLocationIcon color="primary" />
        </IconButton>
      </Tooltip>
      <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
        Tap on the map to drop a pin at the delivery location.
      </Typography>
    </Box>
  );
}
