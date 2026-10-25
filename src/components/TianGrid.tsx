import { GRID } from '../lib/colors';

// The 田字格 practice grid: a square with dashed center and diagonal lines.
export default function TianGrid({ size }: { size: number }) {
  const dash = { stroke: GRID, strokeWidth: 1, strokeDasharray: '4 4' };
  return (
    <g aria-hidden="true">
      <rect x={0.5} y={0.5} width={size - 1} height={size - 1} fill="#fff" stroke={GRID} strokeWidth={1.5} rx={6} />
      <line x1={0} y1={size / 2} x2={size} y2={size / 2} {...dash} />
      <line x1={size / 2} y1={0} x2={size / 2} y2={size} {...dash} />
      <line x1={0} y1={0} x2={size} y2={size} {...dash} />
      <line x1={size} y1={0} x2={0} y2={size} {...dash} />
    </g>
  );
}
