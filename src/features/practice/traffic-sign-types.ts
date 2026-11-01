
export type TrafficSignGroupCode =
  | "cam"
  | "nguy_hiem"
  | "hieu_lenh"
  | "chi_dan"
  | "phu";

export type TrafficSignCategory =
  | "PROHIBITORY"
  | "WARNING"
  | "MANDATORY"
  | "GUIDE"
  | "SUPPLEMENTARY";

export interface TrafficSign {
  id: string;
  bankVersion: string;
  code: string;
  name: string;
  groupCode: TrafficSignGroupCode;
  groupName: string;
  mediaFileId: string;
  sortOrder: number;
  meaning: string;
  memoryTip: string | null;
}

export interface TrafficSignGroupDto {
  groupCode: TrafficSignGroupCode;
  groupName: string;
  totalElements: number;
}

export interface TrafficSignListResult {
  bankVersion: string;
  items: TrafficSign[];
  totalElements: number;
  page: number;
  size: number;
  totalPages: number;
  groups: TrafficSignGroupDto[];
}

export interface TrafficSignListParams {
  category?: TrafficSignCategory;
  search?: string;
  page?: number;
  size?: number;
}

export interface TrafficSignCategoryOption {
  id: TrafficSignCategory;
  groupCode: TrafficSignGroupCode;
  label: string;
}

export const TRAFFIC_SIGN_CATEGORIES: TrafficSignCategoryOption[] = [
  { id: "PROHIBITORY", groupCode: "cam", label: "Biển báo cấm" },
  { id: "WARNING", groupCode: "nguy_hiem", label: "Biển báo nguy hiểm" },
  { id: "MANDATORY", groupCode: "hieu_lenh", label: "Biển báo hiệu lệnh" },
  { id: "GUIDE", groupCode: "chi_dan", label: "Biển báo chỉ dẫn" },
  { id: "SUPPLEMENTARY", groupCode: "phu", label: "Biển báo phụ" },
];

export function getTrafficSignGroupCode(
  category?: TrafficSignCategory
): TrafficSignGroupCode | undefined {
  return TRAFFIC_SIGN_CATEGORIES.find((item) => item.id === category)?.groupCode;
}
