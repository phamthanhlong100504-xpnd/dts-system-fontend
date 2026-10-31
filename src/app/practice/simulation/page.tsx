"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { RequireAuth } from "@/components/require-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SIMULATION_CHAPTERS,
  SimulationEvaluation,
} from "@/features/simulation/simulation-service";
import {
  useEvaluateSimulation,
  useSimulationDetail,
} from "@/features/simulation/use-simulation";

export default function SimulationPracticePage() {
  const [currentScenario, setCurrentScenario] = useState<number>(1);
  const [sessionScores, setSessionScores] = useState<Record<number, number>>({});

  // Reset video state when scenario changes
  const [flaggedSecond, setFlaggedSecond] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<SimulationEvaluation | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: scenario, isLoading, isError } = useSimulationDetail(currentScenario);
  const evaluateMutation = useEvaluateSimulation();

  // Reset state on scenario change
  useEffect(() => {
    setFlaggedSecond(null);
    setEvaluation(null);
    setCurrentTime(0);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [currentScenario]);

  // Handle Space key for flagging
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        triggerFlag();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const triggerFlag = () => {
    if (flaggedSecond !== null || !videoRef.current) return;

    const time = videoRef.current.currentTime;
    setFlaggedSecond(time);

    evaluateMutation.mutate(
      { scenarioNumber: currentScenario, selectedSecond: time },
      {
        onSuccess: (res) => {
          setEvaluation(res);
          setSessionScores((prev) => ({
            ...prev,
            [currentScenario]: res.score,
          }));
        },
      }
    );
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || scenario?.durationSeconds || 30);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    // If user never flagged during playback, evaluate as 0 pts
    if (flaggedSecond === null && !evaluation) {
      const finalTime = duration || 30;
      setFlaggedSecond(finalTime);
      evaluateMutation.mutate(
        { scenarioNumber: currentScenario, selectedSecond: finalTime },
        {
          onSuccess: (res) => {
            setEvaluation(res);
            setSessionScores((prev) => ({
              ...prev,
              [currentScenario]: res.score,
            }));
          },
        }
      );
    }
  };

  const restartVideo = () => {
    setFlaggedSecond(null);
    setEvaluation(null);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const totalDuration = duration || scenario?.durationSeconds || 30;
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const flagPercent =
    flaggedSecond !== null && totalDuration > 0
      ? (flaggedSecond / totalDuration) * 100
      : null;

  // Find current chapter
  const currentChapter = SIMULATION_CHAPTERS.find(
    (c) => currentScenario >= c.start && currentScenario <= c.end
  );

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 max-w-7xl space-y-6 py-6">
        {/* Navigation header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentChapter?.title ?? "Mô phỏng GPLX"}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Tình huống {currentScenario}/120
                </Badge>
              </div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl mt-1">
                {isLoading ? (
                  <Skeleton className="h-7 w-64 inline-block" />
                ) : (
                  scenario?.title ?? `Tình huống số ${currentScenario}`
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentScenario <= 1}
              onClick={() => setCurrentScenario((prev) => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentScenario >= 120}
              onClick={() => setCurrentScenario((prev) => Math.min(120, prev + 1))}
            >
              Tiếp theo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Video Player, Flag Action & Scoring */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Viewport Container */}
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-lg aspect-video flex items-center justify-center border border-border">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm">Đang tải video tình huống #{currentScenario}...</p>
                </div>
              ) : isError || !scenario ? (
                <div className="text-center p-6 text-destructive space-y-2">
                  <AlertCircle className="h-10 w-10 mx-auto" />
                  <p className="font-semibold">Không thể tải tình huống mô phỏng.</p>
                  <p className="text-xs text-muted-foreground">Vui lòng kiểm tra kết nối mạng và thử lại.</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={scenario.videoUrl}
                    poster={scenario.thumbnailUrl}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnded}
                    onClick={togglePlay}
                    className="w-full h-full object-contain cursor-pointer"
                  />

                  {/* Play Overlay when paused */}
                  {!isPlaying && (
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity hover:bg-black/30"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl transition-transform hover:scale-110">
                        <Play className="h-8 w-8 ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Top Bar inside Video: Timer and Status */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="rounded-lg bg-black/70 px-3 py-1 font-mono text-xs font-semibold text-white backdrop-blur">
                      ⏱ {currentTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
                    </div>
                    {flaggedSecond !== null && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1 text-xs font-bold text-white shadow backdrop-blur animate-bounce">
                        <Flag className="h-3.5 w-3.5 fill-white" /> Đã cắm cờ tại {flaggedSecond.toFixed(2)}s
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Timeline & Scoring Zones */}
            <div className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Tiến trình tình huống</span>
                <span>{currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s</span>
              </div>

              {/* Custom Timeline Track with Score Zones & Flag Marker */}
              <div className="relative h-6 w-full overflow-hidden rounded-lg bg-muted">
                {/* 5-Score Zones Background (shown if timeline available) */}
                {scenario?.scoringTimeline && totalDuration > 0 && (
                  <div className="absolute inset-0 pointer-events-none opacity-85">
                    {/* Zone 5 Points: t5_start to t4_start */}
                    <div
                      style={{
                        left: `${(scenario.scoringTimeline.t5_start / totalDuration) * 100}%`,
                        width: `${((scenario.scoringTimeline.t4_start - scenario.scoringTimeline.t5_start) / totalDuration) * 100}%`,
                      }}
                      className="absolute inset-y-0 bg-green-500 flex items-center justify-center text-[10px] font-bold text-white"
                      title="Vùng 5 Điểm"
                    >
                      5đ
                    </div>
                    {/* Zone 4 Points */}
                    <div
                      style={{
                        left: `${(scenario.scoringTimeline.t4_start / totalDuration) * 100}%`,
                        width: `${((scenario.scoringTimeline.t3_start - scenario.scoringTimeline.t4_start) / totalDuration) * 100}%`,
                      }}
                      className="absolute inset-y-0 bg-lime-500 flex items-center justify-center text-[10px] font-bold text-white"
                      title="Vùng 4 Điểm"
                    >
                      4đ
                    </div>
                    {/* Zone 3 Points */}
                    <div
                      style={{
                        left: `${(scenario.scoringTimeline.t3_start / totalDuration) * 100}%`,
                        width: `${((scenario.scoringTimeline.t2_start - scenario.scoringTimeline.t3_start) / totalDuration) * 100}%`,
                      }}
                      className="absolute inset-y-0 bg-amber-400 flex items-center justify-center text-[10px] font-bold text-gray-900"
                      title="Vùng 3 Điểm"
                    >
                      3đ
                    </div>
                    {/* Zone 2 Points */}
                    <div
                      style={{
                        left: `${(scenario.scoringTimeline.t2_start / totalDuration) * 100}%`,
                        width: `${((scenario.scoringTimeline.t1_start - scenario.scoringTimeline.t2_start) / totalDuration) * 100}%`,
                      }}
                      className="absolute inset-y-0 bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white"
                      title="Vùng 2 Điểm"
                    >
                      2đ
                    </div>
                    {/* Zone 1 Point */}
                    <div
                      style={{
                        left: `${(scenario.scoringTimeline.t1_start / totalDuration) * 100}%`,
                        width: `${((scenario.scoringTimeline.t0_end - scenario.scoringTimeline.t1_start) / totalDuration) * 100}%`,
                      }}
                      className="absolute inset-y-0 bg-red-500 flex items-center justify-center text-[10px] font-bold text-white"
                      title="Vùng 1 Điểm"
                    >
                      1đ
                    </div>
                  </div>
                )}

                {/* Video Playhead Progress Bar */}
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="absolute inset-y-0 left-0 bg-primary/40 border-r-2 border-primary pointer-events-none transition-all duration-75"
                />

                {/* Flag Pin Marker */}
                {flagPercent !== null && (
                  <div
                    style={{ left: `${flagPercent}%` }}
                    className="absolute inset-y-0 -ml-2.5 flex items-center justify-center z-20 pointer-events-none"
                  >
                    <div className="flex h-6 w-5 items-center justify-center rounded bg-red-600 shadow-md">
                      <Flag className="h-3.5 w-3.5 fill-white text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls: Flag Button & Video controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="default"
                    variant={flaggedSecond ? "secondary" : "destructive"}
                    disabled={flaggedSecond !== null || !isPlaying}
                    onClick={triggerFlag}
                    className="font-bold gap-2 text-sm px-6 h-11 shadow"
                  >
                    <Flag className="h-4 w-4 fill-current" />
                    {flaggedSecond ? "ĐÃ CẮM CỜ" : "CẮM CỜ (PHÍM SPACE)"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={restartVideo}
                    title="Làm lại tình huống"
                    className="h-11 w-11"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                    className="h-11 w-11"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground text-right hidden sm:block">
                  Mẹo: Bấm <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">Space</kbd> ngay khi phát hiện nguy cơ
                </div>
              </div>
            </div>

            {/* Evaluation Result Feedback Card */}
            {evaluation && (
              <Card
                className={`border-2 transition-all duration-300 ${
                  evaluation.score === 5
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : evaluation.score > 0
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {evaluation.score > 0 ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      )}
                      <CardTitle className="text-lg font-bold">
                        {evaluation.score === 5
                          ? "Phản xạ xuất sắc — Đạt điểm tối đa!"
                          : evaluation.score > 0
                          ? `Phản xạ tốt — Đạt ${evaluation.score}/5 điểm`
                          : "Chưa đạt điểm — Bấm sai thời điểm"}
                      </CardTitle>
                    </div>

                    <div
                      className={`text-2xl font-extrabold px-3 py-1 rounded-xl shadow-sm ${
                        evaluation.score === 5
                          ? "bg-green-600 text-white"
                          : evaluation.score > 0
                          ? "bg-amber-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {evaluation.score} / 5 ĐIỂM
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-foreground leading-relaxed">{evaluation.message}</p>

                  {/* Hazard Sign & Tip */}
                  <div className="grid gap-2 pt-1 sm:grid-cols-2">
                    {evaluation.hazardSign && (
                      <div className="rounded-lg bg-card p-3 border text-xs space-y-1">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> Dấu hiệu nhận diện:
                        </span>
                        <p className="text-muted-foreground">{evaluation.hazardSign}</p>
                      </div>
                    )}
                    {evaluation.tip && (
                      <div className="rounded-lg bg-card p-3 border text-xs space-y-1">
                        <span className="font-semibold text-amber-600 flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5" /> Mẹo canh thời điểm:
                        </span>
                        <p className="text-muted-foreground">{evaluation.tip}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Col: Scenario Selector by Chapters */}
          <div className="space-y-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" /> Danh sách 120 tình huống
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    Đã luyện: {Object.keys(sessionScores).length}/120
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Tabs defaultValue={`ch-${currentChapter?.id ?? 1}`} className="w-full">
                  <TabsList className="grid grid-cols-6 h-9 mb-3">
                    {SIMULATION_CHAPTERS.map((ch) => (
                      <TabsTrigger
                        key={ch.id}
                        value={`ch-${ch.id}`}
                        className="text-xs px-1"
                        title={ch.title}
                      >
                        C{ch.id}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {SIMULATION_CHAPTERS.map((ch) => (
                    <TabsContent key={ch.id} value={`ch-${ch.id}`} className="space-y-3 mt-0">
                      <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
                        <p className="font-semibold">{ch.title}</p>
                        <p className="text-muted-foreground mt-0.5 line-clamp-2">{ch.description}</p>
                      </div>

                      {/* Scenario Number Grid */}
                      <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
                        {Array.from({ length: ch.count }, (_, i) => ch.start + i).map((num) => {
                          const isCurrent = num === currentScenario;
                          const score = sessionScores[num];

                          let badgeColor = "border-border bg-card text-foreground hover:bg-muted";
                          if (score === 5) {
                            badgeColor = "border-green-600 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400";
                          } else if (score !== undefined && score > 0) {
                            badgeColor = "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
                          } else if (score === 0) {
                            badgeColor = "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400";
                          }

                          return (
                            <button
                              key={num}
                              onClick={() => setCurrentScenario(num)}
                              className={`relative flex flex-col items-center justify-center rounded-xl border p-2 text-xs font-bold transition-all ${badgeColor} ${
                                isCurrent ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                              }`}
                            >
                              <span>#{num}</span>
                              {score !== undefined && (
                                <span className="text-[10px] font-semibold opacity-90 mt-0.5">
                                  {score}đ
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

