import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InboxIcon from "@mui/icons-material/Inbox";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

export function LoadingState({ label = "Loading..." }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ py: 8 }}>
      <CircularProgress color="primary" />
      <Typography color="text.secondary">{label}</Typography>
    </Stack>
  );
}

export function EmptyState({ title = "Nothing here yet", subtitle, action }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8, px: 2 }}>
      <InboxIcon sx={{ fontSize: 48, color: "text.disabled" }} />
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography color="text.secondary" textAlign="center" maxWidth={360}>
          {subtitle}
        </Typography>
      )}
      {action}
    </Stack>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  const isNetwork = /network/i.test(message);
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8, px: 2 }}>
      {isNetwork ? (
        <WifiOffIcon sx={{ fontSize: 48, color: "error.main" }} />
      ) : (
        <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main" }} />
      )}
      <Typography variant="h6" color="error.main">
        {isNetwork ? "Network error" : "Something went wrong"}
      </Typography>
      <Typography color="text.secondary" textAlign="center" maxWidth={360}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Stack>
  );
}

export function UnauthorizedState({ message = "You don't have access to this page." }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 8, px: 2 }}>
      <LockOutlinedIcon sx={{ fontSize: 48, color: "text.disabled" }} />
      <Typography variant="h6">Access restricted</Typography>
      <Typography color="text.secondary" textAlign="center" maxWidth={360}>
        {message}
      </Typography>
    </Stack>
  );
}



export function SectionLoader({ height = 200, message = "Loading..." }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height={height}
      gap={1.5}
    >
      <CircularProgress size={30} thickness={4} />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          animation: "pulse 1.5s ease-in-out infinite",
          "@keyframes pulse": {
            "0%, 100%": { opacity: 0.5 },
            "50%": { opacity: 1 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}