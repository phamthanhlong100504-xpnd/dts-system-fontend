import { contentBuilderApi } from "@/lib/api";
import {
  getTrafficSignGroupCode,
  type TrafficSign,
  type TrafficSignListParams,
  type TrafficSignListResult,
} from "@/features/practice/traffic-sign-types";

export function getTrafficSigns({
  category,
  search,
  page = 0,
  size = 20,
}: TrafficSignListParams): Promise<TrafficSignListResult> {
  return contentBuilderApi.get<TrafficSignListResult>("/v1/traffic-signs", {
    params: {
      group: getTrafficSignGroupCode(category),
      q: search?.trim() || undefined,
      page,
      size,
    },
  });
}

export function getTrafficSignById(id: string): Promise<TrafficSign> {
  return contentBuilderApi.get<TrafficSign>(
    `/v1/traffic-signs/${encodeURIComponent(id)}`
  );
}
