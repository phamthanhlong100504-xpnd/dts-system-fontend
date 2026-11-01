
export interface MemoryTipDto {
  id: string;
  sourceTipId: number;
  sortOrder: number;
  title: string;
  quickRule: string;
  explanation: string;
}

export interface MemoryTipListDto {
  bankVersion: string;
  items: MemoryTipDto[];
  totalElements: number;
}

export interface PracticeResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  traceId: string | null;
}

export type MemoryTipListResponse = PracticeResponse<MemoryTipListDto>;


export type MemoryTip = MemoryTipDto;
export type MemoryTipListResult = MemoryTipListDto;
