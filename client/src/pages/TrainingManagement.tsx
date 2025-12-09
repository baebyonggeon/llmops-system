import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, TrendingDown } from "lucide-react";
import { useState } from "react";

export default function TrainingManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for trainings
  const trainings = [
    {
      id: 1,
      trainingId: "train_001",
      trainingName: "Wise-LLOA-max",
      baseModel: "WISE LLM",
      objective: "업무지원 고도화",
      status: "completed",
      epochs: 10,
      batchSize: 32,
      learningRate: 0.0001,
      loss: 0.1234,
      gpuUsage: 85.5,
      estimatedTime: 120,
      createdDate: "2025.01.20",
    },
    {
      id: 2,
      trainingId: "train_002",
      trainingName: "Konan-LLM-ENT-11",
      baseModel: "KONANENT-11",
      objective: "법률 고도화",
      status: "completed",
      epochs: 15,
      batchSize: 16,
      learningRate: 0.00005,
      loss: 0.0856,
      gpuUsage: 92.3,
      estimatedTime: 180,
      createdDate: "2025.01.15",
    },
    {
      id: 3,
      trainingId: "train_003",
      trainingName: "Midm-Pro-Training",
      baseModel: "믿음 2.0 Pro",
      objective: "행정심판 고도화",
      status: "running",
      epochs: 20,
      batchSize: 32,
      learningRate: 0.0001,
      loss: 0.2145,
      gpuUsage: 95.0,
      estimatedTime: 240,
      createdDate: "2025.01.25",
    },
    {
      id: 4,
      trainingId: "train_004",
      trainingName: "Conference-LLM",
      baseModel: "Solar Pro2",
      objective: "회의 고도화",
      status: "pending",
      epochs: 10,
      batchSize: 32,
      learningRate: 0.0001,
      loss: null,
      gpuUsage: 0,
      estimatedTime: 150,
      createdDate: "2025.01.28",
    },
  ];

  const filteredTrainings = trainings.filter((training) =>
    training.trainingName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    training.trainingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300";
      case "running":
        return "bg-blue-500/20 text-blue-300";
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
      case "completed":
        return "완료";
      case "running":
        return "진행 중";
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
              모델 학습 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredTrainings.length}개의 학습 작업
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 모델 학습
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="학습명, ID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Trainings List */}
      <div className="space-y-3">
        {filteredTrainings.map((training) => (
          <Card
            key={training.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {training.trainingName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        ID: {training.trainingId}
                      </p>
                    </div>
                    <Badge className={getStatusColor(training.status)}>
                      {getStatusLabel(training.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-400">기본 모델</p>
                      <p className="font-semibold text-white">
                        {training.baseModel}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">목표</p>
                      <p className="font-semibold text-white">
                        {training.objective}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Epoch</p>
                      <p className="font-semibold text-white">
                        {training.epochs}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Batch Size</p>
                      <p className="font-semibold text-white">
                        {training.batchSize}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Learning Rate</p>
                      <p className="font-semibold text-white text-xs">
                        {training.learningRate}
                      </p>
                    </div>
                  </div>

                  {/* Progress and Metrics */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {training.status === "running" && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">GPU 사용률</p>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${training.gpuUsage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-300">
                          {training.gpuUsage}%
                        </p>
                      </div>
                    )}
                    {training.loss !== null && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">Loss</p>
                        <p className="text-sm font-semibold text-white">
                          {training.loss}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">예상 시간</p>
                      <p className="text-sm font-semibold text-white">
                        {training.estimatedTime}분
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    생성일: {training.createdDate}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrainings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
