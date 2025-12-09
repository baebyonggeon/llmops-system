import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Zap } from "lucide-react";

export default function Dashboard() {
  // Mock data for GPU/CPU/Memory resources
  const resources = [
    { name: "GPU#1", usage: 53, type: "GPU" },
    { name: "CPU#1", usage: 42, type: "CPU" },
    { name: "MEMORY#1", usage: 25, type: "Memory" },
    { name: "MEMORY#2", usage: 14, type: "Memory" },
  ];

  // Mock data for deployed models
  const deployedModels = [
    { name: "믿음 2.0 Pro", calls: 34208964 },
    { name: "WISE LLM", calls: 34208964 },
    { name: "KONANENT-11", calls: 34208964 },
    { name: "Solar Pro2", calls: 34208964 },
  ];

  // Mock data for API calls
  const apiMetrics = [
    { name: "회의 관리", calls: 34208964 },
    { name: "업무지원", calls: 34208964 },
    { name: "법률 및 행정심판", calls: 34208964 },
    { name: "질의 응답", calls: 34208964 },
  ];

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          LLMOps 대시보드
        </h1>
        <p className="text-sm text-gray-400">
          AI 모델 운영 현황을 한 눈에 확인하세요
        </p>
      </div>

      {/* GPU/CPU/Memory Resources Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">자원 현황</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((resource) => (
            <div
              key={resource.name}
              className="metric-card tech-line"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    {resource.name}
                  </span>
                  <span className="text-xs text-blue-400 font-semibold">
                    {resource.type}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-white">
                      {resource.usage}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${resource.usage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployed Models Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          <h2 className="text-lg font-semibold text-white">배포 모델 및 호출 건수</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {deployedModels.map((model) => (
            <div
              key={model.name}
              className="metric-card tech-line"
            >
              <div className="space-y-3">
                <h3 className="font-semibold text-white">{model.name}</h3>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">호출 건수</p>
                  <p className="text-xl font-bold text-green-400">
                    {model.calls.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">API 키 및 호출 건수</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {apiMetrics.map((api) => (
            <div
              key={api.name}
              className="metric-card tech-line"
            >
              <div className="space-y-3">
                <h3 className="font-semibold text-white">{api.name}</h3>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400">호출 건수</p>
                  <p className="text-xl font-bold text-purple-400">
                    {api.calls.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
