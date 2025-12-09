import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
import { useState } from "react";

export default function DeploymentManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for deployments
  const deployments = [
    {
      id: 1,
      deploymentId: "deploy_001",
      modelName: "WISE LLM",
      deploymentName: "WISE LLM-G",
      status: "running",
      tensorParallel: 2,
      maxModelLen: 65535,
      gpuMemoryUtil: 0.95,
      callCount: 1234567,
      createdDate: "2025.01.20",
    },
    {
      id: 2,
      deploymentId: "deploy_002",
      modelName: "믿음 2.0 Pro",
      deploymentName: "믿음-배포-v1",
      status: "running",
      tensorParallel: 2,
      maxModelLen: 32768,
      gpuMemoryUtil: 0.85,
      callCount: 987654,
      createdDate: "2025.01.15",
    },
    {
      id: 3,
      deploymentId: "deploy_003",
      modelName: "Solar Pro2",
      deploymentName: "Solar-테스트",
      status: "pending",
      tensorParallel: 1,
      maxModelLen: 16384,
      gpuMemoryUtil: 0.0,
      callCount: 0,
      createdDate: "2025.01.25",
    },
  ];

  const filteredDeployments = deployments.filter((deployment) =>
    deployment.deploymentName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    deployment.deploymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500/20 text-green-300";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      case "failed":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "running":
        return "실행 중";
      case "pending":
        return "대기 중";
      case "failed":
        return "실패";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              모델 배포 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredDeployments.length}개의 배포
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 배포
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="배포명, ID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Deployments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                배포명
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                모델
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                상태
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                호출 건수
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                생성일
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-300">
                작업
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDeployments.map((deployment) => (
              <tr
                key={deployment.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-white">
                      {deployment.deploymentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {deployment.deploymentId}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-white">
                  {deployment.modelName}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(deployment.status)}>
                    {getStatusLabel(deployment.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-white">
                  {deployment.callCount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {deployment.createdDate}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDeployments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
