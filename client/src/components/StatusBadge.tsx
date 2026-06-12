import { Badge } from "./ui/Badge";
import {
  bookingStatusStyle,
  assetStatusStyle,
  conditionStyle,
  titleCase,
} from "../lib/format";
import type { BookingStatus, AssetStatus, AssetCondition } from "../types";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge className={bookingStatusStyle[status]}>{titleCase(status)}</Badge>;
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge className={assetStatusStyle[status]}>{titleCase(status)}</Badge>;
}

export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  return <Badge className={conditionStyle[condition]}>{titleCase(condition)}</Badge>;
}
