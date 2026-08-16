import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

/** A single-image picker used by product/shop/avatar forms. Keeps the raw File
 * object in state so the parent form can send it as multipart/form-data. */
export default function ImageUpload({ value, file, onChange, label = "Upload image", variant = "square" }) {
  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return value || "";
  }, [file, value]);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        src={previewUrl || undefined}
        variant={variant === "square" ? "rounded" : "circular"}
        sx={{ width: 72, height: 72, bgcolor: "grey.200" }}
      >
        {!previewUrl && <CloudUploadIcon color="disabled" />}
      </Avatar>
      <Box>
        <Button variant="outlined" component="label" size="small" startIcon={<CloudUploadIcon />}>
          {label}
          <input
            type="file"
            hidden
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </Button>
        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
          JPG, PNG or WEBP, up to 5 MB.
        </Typography>
      </Box>
    </Stack>
  );
}
