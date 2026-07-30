"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export function AdminSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const points = data.map((value, i) => ({ i, value }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "#4ADE80" : "#F87171"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
