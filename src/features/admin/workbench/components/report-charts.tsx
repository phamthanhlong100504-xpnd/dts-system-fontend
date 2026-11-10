"use client";

import { useId } from "react";
import type { ReportBreakdown, ReportSeries } from "../operations-model";
import { AuthorizedAdminLink } from "./operations-workspace";
import styles from "./admin-management-visual.module.css";

const number = (value: number) => value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
const day = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}/${match[2]}` : iso;
};

/** Only confirmed source values are drawn. Nulls split the line; they never become zeros. */
export function DailyTrendChart({ trend, label }: {
  trend: Array<{ date: string; value: number | null }>;
  label: string;
}) {
  const seed = useId().replace(/:/g, "");
  const valid = trend.filter((p): p is { date: string; value: number } => p.value !== null);
  if (!valid.length) return null;
  const high = Math.max(1, ...valid.map(p => p.value));
  const max = high <= 4 ? Math.ceil(high) : Math.ceil(high / 4) * 4;
  const left = 68, top = 28, width = Math.max(790, (trend.length - 1) * 86), height = 210;
  const x = (i: number) => left + i * width / Math.max(1, trend.length - 1);
  const y = (value: number) => top + height * (1 - value / max);
  const segments: Array<Array<{ x: number; y: number; date: string; value: number }>> = [];
  trend.forEach((p, i) => {
    if (p.value === null) { if (segments.at(-1)?.length) segments.push([]); return; }
    if (!segments.length) segments.push([]);
    segments.at(-1)!.push({ x: x(i), y: y(p.value), date: p.date, value: p.value });
  });
  const paths = segments.filter(s => s.length).map(s => ({
    points: s,
    line: s.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" "),
    area: `${s.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")} L ${s.at(-1)!.x.toFixed(2)} ${top + height} L ${s[0].x.toFixed(2)} ${top + height} Z`,
  }));
  const indices = trend.map((_, index) => index);
  return (
    <div className={styles.chartSurface}>
      <div className={styles.chartIntro}>
        <div>
          <h3>Xu hướng theo ngày</h3>
          <p>{label}</p>
        </div>
        <span className={styles.chartLegend}><span aria-hidden="true" />Số lượt ghi nhận</span>
      </div>
      <div className={styles.chartScroll}><svg viewBox={`0 0 ${left + width + 32} 292`} style={{ minWidth: `${left + width + 32}px` }} preserveAspectRatio="xMinYMid meet" role="img"
        aria-label={`Biểu đồ xu hướng từ ${trend[0]?.date} đến ${trend.at(-1)?.date}, có ${valid.length} ngày có dữ liệu`}
        className={styles.trendChart}>
        <defs>
          <linearGradient id={`${seed}-trend-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity=".19" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => {
          const value = max * i / 4, yy = y(value);
          return <g key={i}>
            <line x1={left} x2={left + width} y1={yy} y2={yy} stroke="#e7eaf2" strokeDasharray={i === 0 ? undefined : "4 6"} />
            <text x={left - 16} y={yy + 5} textAnchor="end" fontSize="13" fill="currentColor" opacity=".68">{number(value)}</text>
          </g>;
        })}
        {paths.map((part, index) => <g key={index}>
          {part.points.length > 1 && <path d={part.area} fill={`url(#${seed}-trend-fill)`} />}
          <path d={part.line} stroke="#2563eb" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {part.points.map(p => <circle key={`${p.date}:${p.x}`} cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2.7">
            <title>{`${day(p.date)}: ${number(p.value)} lượt`}</title>
          </circle>)}
        </g>)}
        {indices.map(i => <text key={i} x={x(i)} y="268" fontSize="13.5" textAnchor={i === 0 ? "start" : i === trend.length - 1 ? "end" : "middle"} fill="currentColor" opacity=".72">{day(trend[i]?.date ?? "")}</text>)}
      </svg></div>
      {valid.length !== trend.length && <p className={styles.chartHint}>Một số ngày chưa có dữ liệu được xác nhận.</p>}
    </div>
  );
}

export function SeriesChart({ series }: { series: ReportSeries }) {
  const available = series.points.filter((p): p is { label: string; value: number } => p.value !== null);
  if (!available.length || series.dataStatus === "UNAVAILABLE") return null;
  const max = Math.max(1, ...available.map(p => p.value));
  return <section className={styles.sectionCard}>
    <div className={styles.cardHeading}><h3>{series.label}</h3></div>
    <div className={styles.barRows} role="img" aria-label={`${series.label}: ${available.map(p => `${p.label} ${number(p.value)}`).join(", ")}`}>
      {available.map(p => <div key={p.label} className={styles.barRow}>
        <div className={styles.barLabel}><span>{p.label}</span><strong>{number(p.value)} {series.unitLabel}</strong></div>
        <div className={styles.barTrack}><div className={styles.barFill} style={{ width: `${100 * p.value / max}%` }} /></div>
      </div>)}
    </div>
  </section>;
}

export function BreakdownTable({ data }: { data: ReportBreakdown }) {
  if (data.dataStatus === "UNAVAILABLE" || !data.rows.length || !data.columns.length) return null;
  const visibleColumnIndexes = data.columns.map((_, i) => i).filter(i =>
    data.rows.some(row => Boolean(row.cells[i]?.trim()) && row.cells[i] !== "Chưa tính được"));
  if (!visibleColumnIndexes.length) return null;
  const hasLinks = data.rows.some(row => Boolean(row.href));
  return <section className={styles.sectionCard}>
    <div className={styles.cardHeading}><h3>{data.label}</h3></div>
    <div className={styles.tableScroll}><table className={styles.dataTable}>
      <thead><tr>{visibleColumnIndexes.map(i => <th key={i} scope="col">{data.columns[i]}</th>)}{hasLinks && <th scope="col">Thao tác</th>}</tr></thead>
      <tbody>{data.rows.map(row => <tr key={row.id}>
        {visibleColumnIndexes.map(i => <td key={i}>{row.cells[i]}</td>)}
        {hasLinks && <td>{row.href && <AuthorizedAdminLink href={row.href}>Xem</AuthorizedAdminLink>}</td>}
      </tr>)}</tbody>
    </table></div>
  </section>;
}
