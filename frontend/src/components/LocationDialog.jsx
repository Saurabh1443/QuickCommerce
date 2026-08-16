import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";

import MapPicker from "./MapPicker";
import { setLocation } from "../store/slices/uiSlice";

export default function LocationDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const [point, setPoint] = useState(null);
  const [label, setLabel] = useState("");

  const handleSave = () => {
    if (!point?.lat) return;
    dispatch(
      setLocation({
        latitude: point.lat,
        longitude: point.lng,
        label: label || "Selected location",
      })
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Choose delivery location</DialogTitle>
      <DialogContent>
        <MapPicker value={point} onChange={setPoint} />
        <TextField
          fullWidth
          sx={{ mt: 2 }}
          label="Label this location (e.g. Home, Office)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!point?.lat}>
          Confirm location
        </Button>
      </DialogActions>
    </Dialog>
  );
}
