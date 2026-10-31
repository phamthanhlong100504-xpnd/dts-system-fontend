import { contentBuilderApi } from "@/lib/api";
import { getMediaDetail } from "@/features/media/media-service";

export interface ScoringTimeline {
  t0_end: number;
  t1_start: number;
  t2_start: number;
  t3_start: number;
  t4_start: number;
  t5_start: number;
}

export interface SimulationDetail {
  id: string;
  scenarioNumber: number;
  title: string;
  chapterId: number;
  chapterName: string;
  durationSeconds: number;
  videoMediaId?: string;
  thumbnailMediaId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  tip?: string;
  hazardSign?: string;
  scoringTimeline: ScoringTimeline;
  status: string;
}

export interface SimulationEvaluation {
  questionId: string;
  scenarioNumber: number;
  title: string;
  selectedSecond: number;
  score: number; // 0..5
  evaluationResult: string;
  errorCode: string;
  message: string;
  tip?: string;
  hazardSign?: string;
  scoringTimeline: ScoringTimeline;
}

export interface SimulationChapterMeta {
  id: number;
  title: string;
  range: string;
  start: number;
  end: number;
  count: number;
  description: string;
}

export const SIMULATION_CHAPTERS: SimulationChapterMeta[] = [
  {
    id: 1,
    title: "Chương 1: Giao thông trên đường đô thị",
    range: "1–29",
    start: 1,
    end: 29,
    count: 29,
    description: "Các tình huống người đi bộ sang đường, xe cắt ngang, chướng ngại vật khuất tầm nhìn trong đô thị.",
  },
  {
    id: 2,
    title: "Chương 2: Giao thông trên đường nông thôn",
    range: "30–43",
    start: 30,
    end: 43,
    count: 14,
    description: "Đường hẹp, gia súc băng qua đường, khúc cua khuất, xe máy đi ngược chiều.",
  },
  {
    id: 3,
    title: "Chương 3: Giao thông trên đường cao tốc",
    range: "44–63",
    start: 44,
    end: 63,
    count: 20,
    description: "Chuyển làn, xe phanh gấp phía trước, xe nhập làn đột ngột, xe đi lùi trên cao tốc.",
  },
  {
    id: 4,
    title: "Chương 4: Giao thông trên đường núi",
    range: "64–73",
    start: 64,
    end: 73,
    count: 10,
    description: "Đèo dốc quanh co, sương mù, xe tải lấn làn ở khúc cua gấp.",
  },
  {
    id: 5,
    title: "Chương 5: Giao thông trên đường quốc lộ",
    range: "74–90",
    start: 74,
    end: 90,
    count: 17,
    description: "Giao cắt với đường sắt, vượt xe nguy hiểm, người đi bộ băng qua giải phân cách.",
  },
  {
    id: 6,
    title: "Chương 6: Các tình huống tai nạn thực tế",
    range: "91–120",
    start: 91,
    end: 120,
    count: 30,
    description: "Va chạm giao thông thực tế thường gặp, mất lái, chướng ngại vật bất ngờ.",
  },
];

/**
 * Lấy chi tiết tình huống mô phỏng theo số tình huống (1–120) hoặc UUID
 * Tự động phân giải mediaId thành URL phát video trực tiếp từ media service
 */
export async function getSimulationDetail(scenarioNumberOrId: number | string): Promise<SimulationDetail> {
  const detail = await contentBuilderApi.get<SimulationDetail>(`/v1/simulations/${scenarioNumberOrId}`);
  
  if (detail && detail.videoMediaId && !detail.videoUrl) {
    try {
      const media = await getMediaDetail(detail.videoMediaId);
      if (media && media.url) {
        detail.videoUrl = media.url;
      }
    } catch (err) {
      console.warn("Không thể tải URL video từ media service:", err);
    }
  }

  if (detail && detail.thumbnailMediaId && !detail.thumbnailUrl) {
    try {
      const thumb = await getMediaDetail(detail.thumbnailMediaId);
      if (thumb && thumb.url) {
        detail.thumbnailUrl = thumb.url;
      }
    } catch (err) {
      console.warn("Không thể tải URL thumbnail từ media service:", err);
    }
  }

  return detail;
}

/**
 * Đánh giá phản xạ người dùng tại giây bấm space
 */
export async function evaluateSimulation(
  scenarioNumberOrId: number | string,
  selectedSecond: number
): Promise<SimulationEvaluation> {
  return await contentBuilderApi.post<SimulationEvaluation>(
    `/v1/simulations/${scenarioNumberOrId}/evaluate`,
    { selectedSecond }
  );
}
