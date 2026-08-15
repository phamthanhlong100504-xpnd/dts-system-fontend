"use client";

import { useId, useMemo, useState } from "react";

/**
 * Biểu đồ trend nhỏ, single-series (line / bar), render SVG inline.
 * Tuân theo dataviz guidelines: line 2px, bar ≤24px + bo 4px ở data-end,
 * area fill ~10%, gridline hairline, không dùng legend (chỉ 1 series),
 * hover có crosshair + tooltip. Palette light/dark theo class `.dark`
 * (xem globals.css: --chart-series/--chart-ink/--chart-muted/--chart-grid).
 */

export interface TrendPoint {
  label: string;
  value: number | null;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
  variant?: "line" | "bar";
  formatValue?: (v: number) => string;
  emptyLabel?: string;
}

const W = 560;
const PAD = { top: 18, right: 18, bottom: 30, left: 46 };
const GRID_STEPS = 4;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const frac = value / pow;
  const step = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return step * pow;
}

function defaultFormat(v: number): string {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

export function TrendChart({
  data,
  height = 200,
  variant = "line",
  formatValue = defaultFormat,
  emptyLabel = "Chưa có dữ liệu",
}: TrendChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  const H = height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const baselineY = PAD.top + plotH;

  const scale = useMemo(() => {
    const vals = data.map((d) => d.value).filter((v): v is number => v != null);
    const max = vals.length ? niceMax(Math.max(...vals)) : 1;
    const n = data.length;
    const x = (i: number) =>
      PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = (v: number) => PAD.top + (1 - v / max) * plotH;
    return { max, x, y, n };
  }, [data, plotW, plotH]);

  const linePath = useMemo(() => {
    const parts: string[] = [];
    data.forEach((d, i) => {
      if (d.value == null) return;
      parts.push(`${parts.length ? "L" : "M"}${scale.x(i).toFixed(1)},${scale.y(d.value).toFixed(1)}`);
    });
    return parts.join(" ");
  }, [data, scale]);

  const areaPath = useMemo(() => {
    if (!linePath) return "";
    let lastX = PAD.left;
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].value != null) {
        lastX = scale.x(i);
        break;
      }
    }
    return `${linePath} L${lastX.toFixed(1)},${baselineY.toFixed(1)} L${PAD.left.toFixed(1)},${baselineY.toFixed(1)} Z`;
  }, [linePath, data, scale, baselineY]);

  const gridTicks = useMemo(() => {
    const ticks: { y: number; value: number }[] = [];
    for (let s = 0; s <= GRID_STEPS; s++) {
      const value = (scale.max * s) / GRID_STEPS;
      ticks.push({ y: scale.y(value), value });
    }
    return ticks;
  }, [scale]);

  if (!data.length || data.every((d) => d.value == null)) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  const handleMove = (clientX: number, rect: DOMRect) => {
    const ratio = (clientX - rect.left) / rect.width;
    const i = Math.round(ratio * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };

  const hoverPoint =
    hover != null && data[hover]?.value != null
      ? {
          x: scale.x(hover),
          y: scale.y(data[hover].value as number),
          label: data[hover].label,
          value: formatValue(data[hover].value as number),
        }
      : null;

  // Chỉ đánh dấu giá trị trên điểm cuối (không đánh số mọi điểm)
  const lastIndex = data.length - 1;
  const lastValue = data[lastIndex]?.value;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => handleMove(e.clientX, e.currentTarget.getBoundingClientRect())}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-series)" stopOpacity="0.10" />
            <stop offset="100%" stopColor="var(--chart-series)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={t.y}
              y2={t.y}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={t.y + 4}
              textAnchor="end"
              fill="var(--chart-muted)"
              fontSize={11}
            >
              {formatValue(t.value)}
            </text>
          </g>
        ))}

        {variant === "bar" ? (
          <Bars data={data} scale={scale} baselineY={baselineY} formatValue={formatValue} />
        ) : (
          <>
            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--chart-series)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {variant === "line" && lastValue != null && (
          <g>
            <circle
              cx={scale.x(lastIndex)}
              cy={scale.y(lastValue)}
              r={4}
              fill="var(--chart-series)"
              stroke="var(--card)"
              strokeWidth={2}
            />
            <text
              x={scale.x(lastIndex)}
              y={scale.y(lastValue) - 10}
              textAnchor="middle"
              fill="var(--chart-ink)"
              fontSize={11}
              fontWeight={600}
            >
              {formatValue(lastValue)}
            </text>
          </g>
        )}

        <XLabels data={data} scale={scale} labelY={baselineY + 16} />

        {hoverPoint && (
          <g>
            <line
              x1={hoverPoint.x}
              x2={hoverPoint.x}
              y1={PAD.top}
              y2={baselineY}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <circle
              cx={hoverPoint.x}
              cy={hoverPoint.y}
              r={4}
              fill="var(--chart-series)"
              stroke="var(--card)"
              strokeWidth={2}
            />
            <TooltipBox
              x={hoverPoint.x}
              y={hoverPoint.y}
              label={hoverPoint.label}
              value={hoverPoint.value}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

function Bars({
  data,
  scale,
  baselineY,
  formatValue,
}: {
  data: TrendPoint[];
  scale: { x: (i: number) => number; y: (v: number) => number; n: number };
  baselineY: number;
  formatValue: (v: number) => string;
}) {
  const slot = scale.n > 1 ? scale.x(1) - scale.x(0) : 40;
  const barW = Math.min(24, slot * 0.6);
  const r = 4;

  return (
    <>
      {data.map((d, i) => {
        if (d.value == null) return null;
        const x = scale.x(i) - barW / 2;
        const y = scale.y(d.value);
        const h = baselineY - y;
        const path = `M${x.toFixed(1)},${baselineY.toFixed(1)} L${x.toFixed(1)},${(y + r).toFixed(1)} Q${x.toFixed(1)},${y.toFixed(1)} ${(x + r).toFixed(1)},${y.toFixed(1)} L${(x + barW - r).toFixed(1)},${y.toFixed(1)} Q${(x + barW).toFixed(1)},${y.toFixed(1)} ${(x + barW).toFixed(1)},${(y + r).toFixed(1)} L${(x + barW).toFixed(1)},${baselineY.toFixed(1)} Z`;
        return (
          <g key={i}>
            <path d={path} fill="var(--chart-series)" opacity={0.85} />
            <text
              x={scale.x(i)}
              y={y - 6}
              textAnchor="middle"
              fill="var(--chart-ink)"
              fontSize={10}
            >
              {formatValue(d.value)}
            </text>
          </g>
        );
      })}
    </>
  );
}

function XLabels({
  data,
  scale,
  labelY,
}: {
  data: TrendPoint[];
  scale: { x: (i: number) => number; n: number };
  labelY: number;
}) {
  const n = data.length;
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <>
      {data.map((d, i) => {
        if (i % step !== 0 && i !== n - 1) return null;
        return (
          <text
            key={i}
            x={scale.x(i)}
            y={labelY}
            textAnchor="middle"
            fill="var(--chart-muted)"
            fontSize={10}
          >
            {d.label}
          </text>
        );
      })}
    </>
  );
}

function TooltipBox({
  x,
  y,
  label,
  value,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
}) {
  const boxW = 120;
  const boxH = 40;
  let bx = x - boxW / 2;
  bx = Math.max(PAD.left - 4, Math.min(W - PAD.right - boxW, bx));
  const by = y - boxH - 12 < PAD.top ? y + 14 : y - boxH - 12;
  return (
    <g pointerEvents="none">
      <rect
        x={bx}
        y={by}
        width={boxW}
        height={boxH}
        rx={6}
        fill="var(--card)"
        stroke="var(--chart-grid)"
        strokeWidth={1}
      />
      <text
        x={bx + boxW / 2}
        y={by + 16}
        textAnchor="middle"
        fill="var(--chart-muted)"
        fontSize={10}
      >
        {label}
      </text>
      <text
        x={bx + boxW / 2}
        y={by + 30}
        textAnchor="middle"
        fill="var(--chart-ink)"
        fontSize={12}
        fontWeight={600}
      >
        {value}
      </text>
    </g>
  );
}
