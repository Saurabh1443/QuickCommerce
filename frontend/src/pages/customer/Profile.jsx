import { LoadingButton } from "@mui/lab";
import { Alert, Card, CardContent, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ImageUpload from "../../components/ImageUpload";
import { extractErrorMessage } from "../../services/api";
import { authService } from "../../services/authService";
import { selectAuthUser, updateProfile } from "../../store/slices/authSlice";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector(selectAuthUser);
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("phone", form.phone);
      if (avatarFile) payload.append("avatar", avatarFile);
      await dispatch(updateProfile(payload)).unwrap();
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await authService.changePassword(passwordForm);
      setPasswordMessage("Password changed successfully.");
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      setPasswordError(extractErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Grid container spacing={3} maxWidth={800}>
      <Grid item xs={12}>
        <Card>
          <CardContent component="form" onSubmit={handleSaveProfile}>
            <Typography variant="h6" mb={2}>
              My profile
            </Typography>
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2}>
              <ImageUpload value={user?.avatar} file={avatarFile} onChange={setAvatarFile} label="Change photo" variant="circle" />
              <TextField label="Full name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Mobile number" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField label="Email" fullWidth value={user?.email || ""} disabled />
              <LoadingButton type="submit" variant="contained" loading={saving} sx={{ alignSelf: "flex-start" }}>
                Save changes
              </LoadingButton>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent component="form" onSubmit={handleChangePassword}>
            <Typography variant="h6" mb={2}>
              Change password
            </Typography>
            {passwordMessage && <Alert severity="success" sx={{ mb: 2 }}>{passwordMessage}</Alert>}
            {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
            <Stack spacing={2}>
              <TextField
                label="Current password"
                type="password"
                fullWidth
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />
              <TextField
                label="New password"
                type="password"
                fullWidth
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
              <LoadingButton type="submit" variant="contained" loading={changingPassword} sx={{ alignSelf: "flex-start" }}>
                Update password
              </LoadingButton>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
