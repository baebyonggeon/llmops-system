import { useTrainingMetrics } from "@/hooks/useTrainingMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { useState } from "react";

export default function TrainingMonitoring() {
  const [trainingId] = useState(1); // Demo training ID
  const { metrics, status, isConnected, startTraining, pauseTraining, resumeTraining, stopTraining, getMetricStats } =
    useTrainingMetrics({
      trainingId,
      autoConnect: true,
    });

  const stats = getMetricStats();

  const handleStartTraining = () => {
    startTraining({ epochs: 20, totalBatches: 100 });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "running":
        return "bg-green-500/20 text-green-300";
      case "paused":
        return "bg-yellow-500/20 text-yellow-300";
      case "completed":
        return "bg-blue-500/20 text-blue-300";
      case "failed":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "running":
        return "진행 중";
      case "paused":
        return "일시 중지";
      case "completed":
        return "완료";
      case "failed":
        return "실패";
      default:
        return "대기 중";
    }
  };

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              학습 모니터링
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Training ID: {trainingId}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-300">
                {isConnected ? "연결됨" : "연결 끊김"}
              </span>
            </div>
            <Badge className={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Badge>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {status === "idle" && (
            <Button
              onClick={handleStartTraining}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              학습 시작
            </Button>
          )}
          {status === "running" && (
            <>
              <Button
                onClick={pauseTraining}
                className="gap-2 bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="h-4 w-4" />
                일시 중지
              </Button>
              <Button
                onClick={stopTraining}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4" />
                중지
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button
                onClick={resumeTraining}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4" />
                재개
              </Button>
              <Button
                onClick={stopTraining}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="h-4 w-4" />
                중지
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">현재 Loss</p>
              <p className="text-2xl font-bold text-white">
                {metrics.length > 0
                  ? metrics[metrics.length - 1].loss.toFixed(4)
                  : "0.0000"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">최소 Loss</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.minLoss.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">평균 Loss</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.avgLoss.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">현재 정확도</p>
              <p className="text-2xl font-bold text-white">
                {metrics.length > 0
                  ? metrics[metrics.length - 1].accuracy.toFixed(2)
                  : "0.00"}
                %
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">평균 정확도</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.avgAccuracy.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs text-gray-400">평균 GPU 사용률</p>
              <p className="text-2xl font-bold text-cyan-400">
                {stats.avgGpuUsage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Loss Chart */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Loss 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="epoch"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: "Epoch", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  labelStyle={{ color: "white" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke="#ef4444"
                  dot={false}
                  isAnimationActive={false}
                  name="Loss"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Accuracy Chart */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">정확도 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="epoch"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: "Epoch", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  labelStyle={{ color: "white" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  fill="rgba(16, 185, 129, 0.2)"
                  isAnimationActive={false}
                  name="정확도 (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* GPU/CPU/Memory Usage */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">자원 사용률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="epoch"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: "Epoch", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  labelStyle={{ color: "white" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gpuUsage"
                  stroke="#06b6d4"
                  dot={false}
                  isAnimationActive={false}
                  name="GPU (%)"
                />
                <Line
                  type="monotone"
                  dataKey="cpuUsage"
                  stroke="#f59e0b"
                  dot={false}
                  isAnimationActive={false}
                  name="CPU (%)"
                />
                <Line
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#8b5cf6"
                  dot={false}
                  isAnimationActive={false}
                  name="Memory (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Batch Progress */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">배치 진행률</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="epoch"
                  stroke="rgba(255,255,255,0.5)"
                  label={{ value: "Epoch", position: "insideBottomRight", offset: -5 }}
                />
                <YAxis stroke="rgba(255,255,255,0.5)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(30, 30, 30, 0.9)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  labelStyle={{ color: "white" }}
                />
                <Legend />
                <Bar
                  dataKey="batchesProcessed"
                  fill="#3b82f6"
                  name="처리된 배치"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">최근 메트릭 (최근 10개)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-2 text-left text-gray-400">Epoch</th>
                  <th className="px-4 py-2 text-left text-gray-400">Loss</th>
                  <th className="px-4 py-2 text-left text-gray-400">정확도</th>
                  <th className="px-4 py-2 text-left text-gray-400">GPU</th>
                  <th className="px-4 py-2 text-left text-gray-400">CPU</th>
                  <th className="px-4 py-2 text-left text-gray-400">Memory</th>
                  <th className="px-4 py-2 text-left text-gray-400">배치</th>
                </tr>
              </thead>
              <tbody>
                {metrics
                  .slice(-10)
                  .reverse()
                  .map((metric, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 text-white">{metric.epoch}</td>
                      <td className="px-4 py-2 text-red-400">
                        {metric.loss.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-green-400">
                        {metric.accuracy.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 text-cyan-400">
                        {metric.gpuUsage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-amber-400">
                        {metric.cpuUsage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-purple-400">
                        {metric.memoryUsage.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-blue-400">
                        {metric.batchesProcessed} / {metric.totalBatches}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
