import CheckIcon from "@mui/icons-material/Check";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";
import { Typography } from "@mui/material";

import { CUSTOMER_TIMELINE, ORDER_STATUS_LABELS } from "../utils/constants";
import { formatDate } from "../utils/format";

export default function OrderTimeline({ order }) {
  const isTerminalFailure = order.status === "CANCELLED" || order.status === "REJECTED";
  const currentIndex = CUSTOMER_TIMELINE.indexOf(order.status);
  const eventByStatus = Object.fromEntries((order.status_events || []).map((e) => [e.to_status, e]));

  if (isTerminalFailure) {
    return (
      <Typography color="error.main" fontWeight={600}>
        Order {order.status === "CANCELLED" ? "cancelled" : "rejected"}
        {order.cancel_reason ? `: ${order.cancel_reason}` : "."}
      </Typography>
    );
  }

  return (
    <Timeline position="right" sx={{ p: 0, m: 0 }}>
      {CUSTOMER_TIMELINE.map((status, index) => {
        const done = currentIndex >= 0 && index <= currentIndex;
        const event = eventByStatus[status];
        return (
          <TimelineItem key={status}>
            <TimelineOppositeContent sx={{ flex: 0.3 }} color="text.secondary" variant="caption">
              {event ? formatDate(event.created_at) : ""}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={done ? "primary" : "grey"} variant={done ? "filled" : "outlined"}>
                {done && <CheckIcon sx={{ fontSize: 14 }} />}
              </TimelineDot>
              {index < CUSTOMER_TIMELINE.length - 1 && (
                <TimelineConnector sx={{ bgcolor: done ? "primary.main" : "grey.300" }} />
              )}
            </TimelineSeparator>
            <TimelineContent>
              <Typography fontWeight={done ? 600 : 400} color={done ? "text.primary" : "text.secondary"}>
                {ORDER_STATUS_LABELS[status]}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
