import { useState } from "react";
import { ChartPoint } from "../types";

interface BMIChartProps {
  trendData: ChartPoint[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export default function BMIChart({
  trendData,
  selectedRange,
  onRangeChange
}: BMIChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (trendData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl" id="bmi-chart-empty">
        <span className="text-zinc-400 font-mono text-sm">Sem dados suficientes para gerar o gráfico de evolução.</span>
      </div>
    );
  }

  // Find min and max BMI to calibrate vertical scaling
  const bmis = trendData.map((d) => d.bmi);
  const maxBmi = Math.max(...bmis, 26);
  const minBmi = Math.max(10, Math.min(...bmis, 18) - 1.5);
  const bmiRange = maxBmi - minBmi;

  // Find min and max Weight to calibrate vertical scaling for the second line
  const weights = trendData.map((d) => d.weight);
  const maxWeight = Math.max(...weights, 80);
  const minWeight = Math.max(20, Math.min(...weights, 50) - 5);
  const weightRange = maxWeight - minWeight;

  // Chart dimensions inside SVG
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate rendering coordinates for BMI points
  const bmiPoints = trendData.map((d, index) => {
    const x = paddingLeft + (index / (trendData.length - 1 || 1)) * chartWidth;
    const y = height - paddingBottom - ((d.bmi - minBmi) / (bmiRange || 1)) * chartHeight;
    return { x, y, ...d };
  });

  // Calculate rendering coordinates for Weight points
  const weightPoints = trendData.map((d, index) => {
    const x = paddingLeft + (index / (trendData.length - 1 || 1)) * chartWidth;
    const y = height - paddingBottom - ((d.weight - minWeight) / (weightRange || 1)) * chartHeight;
    return { x, y, ...d };
  });

  // Build SVG path lines
  let bmiPathD = "";
  if (bmiPoints.length > 0) {
    bmiPathD = `M ${bmiPoints[0].x} ${bmiPoints[0].y}`;
    for (let i = 1; i < bmiPoints.length; i++) {
      bmiPathD += ` L ${bmiPoints[i].x} ${bmiPoints[i].y}`;
    }
  }

  let weightPathD = "";
  if (weightPoints.length > 0) {
    weightPathD = `M ${weightPoints[0].x} ${weightPoints[0].y}`;
    for (let i = 1; i < weightPoints.length; i++) {
      weightPathD += ` L ${weightPoints[i].x} ${weightPoints[i].y}`;
    }
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex flex-col justify-between transition-colors duration-200" id="bmi-chart-card">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-1">
          <h2 className="font-headline font-bold text-lg text-black dark:text-white uppercase tracking-tight">
            Gráfico de Evolução
          </h2>
          {/* Legend indicators */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff6b00] border border-black dark:border-white/25 inline-block"></span>
              <span className="text-[11px] font-bold font-mono text-zinc-600 dark:text-zinc-400">Peso (kg)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10b981] border border-black dark:border-white/25 inline-block"></span>
              <span className="text-[11px] font-bold font-mono text-zinc-600 dark:text-zinc-400">IMC</span>
            </div>
          </div>
        </div>
        
        {/* Interval Selector */}
        <div className="flex gap-2 self-start sm:self-auto">
          {["1M", "3M", "1Y"].map((range) => (
            <button
              key={range}
              id={`btn-range-${range}`}
              onClick={() => onRangeChange(range)}
              className={`px-3 py-1 font-mono font-bold text-xs border-2 border-black transition-all cursor-pointer ${
                selectedRange === range
                  ? "bg-[#ff6b00] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]"
                  : "bg-white text-zinc-800 hover:bg-zinc-100 active:translate-y-0.5"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Drawing */}
      <div className="relative w-full overflow-x-auto select-none">
        <div className="min-w-[500px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Horizontal Grid Rails */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + ratio * chartHeight;
              const bmiVal = (maxBmi - ratio * bmiRange).toFixed(1);
              const wtVal = (maxWeight - ratio * weightRange).toFixed(0);
              return (
                <g key={index}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-800/60"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Left Axis: BMI (Emerald) */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-emerald-600 dark:fill-emerald-400 font-mono text-[9px] font-bold"
                  >
                    {bmiVal}
                  </text>
                  {/* Right Axis: Weight (Orange) */}
                  <text
                    x={width - paddingRight + 8}
                    y={y + 3}
                    textAnchor="start"
                    className="fill-orange-600 dark:fill-[#ff6b00] font-mono text-[9px] font-bold"
                  >
                    {wtVal}kg
                  </text>
                </g>
              );
            })}

            {/* Interactive Vertical Hover Guides */}
            {bmiPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g
                  key={`guide-${idx}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Hover detector column */}
                  <rect
                    x={pt.x - (chartWidth / (trendData.length * 2))}
                    y={paddingTop}
                    width={chartWidth / (trendData.length || 1)}
                    height={chartHeight}
                    fill="transparent"
                  />
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={height - paddingBottom}
                      stroke="#ff6b00"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      className="opacity-50"
                    />
                  )}
                </g>
              );
            })}

            {/* Connecting Continuous Path spline overlay for Weight */}
            <path
              d={weightPathD}
              fill="none"
              stroke="#ff6b00"
              strokeWidth="2.5"
              className="pointer-events-none opacity-85"
            />

            {/* Connecting Continuous Path spline overlay for BMI */}
            <path
              d={bmiPathD}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              className="pointer-events-none opacity-85"
            />

            {/* Draw Point Nodes for Weight (Orange) */}
            {weightPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <circle
                  key={`wt-node-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#ff6b00"
                  stroke="black"
                  strokeWidth={1.5}
                  className="pointer-events-none transition-all duration-150"
                />
              );
            })}

            {/* Draw Point Nodes for BMI (Emerald) */}
            {bmiPoints.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <circle
                  key={`bmi-node-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#10b981"
                  stroke="black"
                  strokeWidth={1.5}
                  className="pointer-events-none transition-all duration-150"
                />
              );
            })}

            {/* Floating Glassmorphic Hover Tooltip Inside SVG */}
            {hoveredIndex !== null && bmiPoints[hoveredIndex] && weightPoints[hoveredIndex] && (
              <g transform={`translate(${bmiPoints[hoveredIndex].x}, ${Math.min(bmiPoints[hoveredIndex].y, weightPoints[hoveredIndex].y) - 40})`}>
                <rect
                  x={-60}
                  y={-28}
                  width={120}
                  height={44}
                  rx={6}
                  fill="white"
                  stroke="black"
                  strokeWidth={2}
                  className="drop-shadow-md"
                />
                <text
                  textAnchor="middle"
                  className="fill-black font-mono text-[9px] font-extrabold"
                  y={-14}
                >
                  {trendData[hoveredIndex].dateLabel}
                </text>
                <text
                  textAnchor="middle"
                  className="fill-orange-600 font-mono text-[9px] font-bold"
                  y={-2}
                >
                  Peso: {weightPoints[hoveredIndex].weight.toFixed(1)}kg
                </text>
                <text
                  textAnchor="middle"
                  className="fill-emerald-600 font-mono text-[9px] font-bold"
                  y={10}
                >
                  IMC: {bmiPoints[hoveredIndex].bmi.toFixed(1)}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Axis Date Labels */}
      <div className="flex justify-between mt-4 px-4 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 font-caption">
        {trendData.map((d, index) => (
          <span key={index}>{d.dateLabel}</span>
        ))}
      </div>
    </div>
  );
}
