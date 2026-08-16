import { Chip } from "@mui/material";

import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  SHOP_STATUS_COLORS,
} from "../utils/constants";
import { titleCase } from "../utils/format";

const COLOR_MAPS = {
  order: ORDER_STATUS_COLORS,
  payment: PAYMENT_STATUS_COLORS,
  shop: SHOP_STATUS_COLORS,
};

export default function StatusChip({ status, type = "order", size = "small" }) {
  const label = type === "order" ? ORDER_STATUS_LABELS[status] || titleCase(status) : titleCase(status);
  const color = COLOR_MAPS[type]?.[status] || "default";
  return <Chip label={label} color={color} size={size} variant="filled" />;
}
