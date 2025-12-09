import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
import { useState } from "react";

export default function EvaluationManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for evaluations
  const evaluations = [
    {
      id: 1,
      evaluationId: "eval_001",
      evaluationName: "WISE LLM 품질 평가",
      modelName: "WISE LLM",
      evaluationType: "quality",
      status: "completed",
      score: 92.5,
      totalTests: 1000,
      passedTests: 925,
      createdDate: "2025.01.20",
    },
    {
      id: 2,
      evaluationId: "eval_002",
      evaluationName: "Konan-LLM 정확도 평가",
      modelName: "KONANENT-11",
      evaluationType: "accuracy",
      status: "completed",
      score: 88.3,
      totalTests: 500,
      passedTests: 442,
      createdDate: "2025.01.18",
    },
    {
      id: 3,
      evaluationId: "eval_003",
      evaluationName: "믿음 2.0 Pro 성능 평가",
      modelName: "믿음 2.0 Pro",
      evaluationType: "performance",
      status: "running",
      score: null,
      totalTests: 2000,
      passedTests: 1234,
      createdDate: "2025.01.25",
    },
    {
      id: 4,
      evaluationId: "eval_004",
      evaluationName: "Solar Pro2 호환성 평가",
      modelName: "Solar Pro2",
      evaluationType: "compatibility",
      status: "pending",
      score: null,
      totalTests: 800,
      passedTests: 0,
      createdDate: "2025.01.28",
    },
  ];

  const filteredEvaluations = evaluations.filter((evaluation) =>
    evaluation.evaluationName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    evaluation.evaluationId.toLowerCase().includes(searchTerm.toLowerCase())
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

  const getEvaluationTypeLabel = (type: string) => {
    switch (type) {
      case "quality":
        return "품질 평가";
      case "accuracy":
        return "정확도 평가";
      case "performance":
        return "성능 평가";
      case "compatibility":
        return "호환성 평가";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              평가 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredEvaluations.length}개의 평가
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 평가 생성
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="평가명, ID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Evaluations Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredEvaluations.map((evaluation) => (
          <Card
            key={evaluation.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {evaluation.evaluationName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    ID: {evaluation.evaluationId}
                  </p>
                </div>
                <Badge className={getStatusColor(evaluation.status)}>
                  {getStatusLabel(evaluation.status)}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-400">모델</p>
                    <p className="font-semibold text-white">
                      {evaluation.modelName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400">평가 유형</p>
                    <p className="font-semibold text-white text-xs">
                      {getEvaluationTypeLabel(evaluation.evaluationType)}
                    </p>
                  </div>
                </div>

                {/* Score Display */}
                {evaluation.score !== null ? (
                  <div className="space-y-2 bg-white/5 rounded p-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm text-gray-400">점수</p>
                      <p className="text-2xl font-bold text-green-400">
                        {evaluation.score}%
                      </p>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        style={{ width: `${evaluation.score}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-white/5 rounded p-3">
                    <p className="text-sm text-gray-400">진행률</p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm text-white">
                        {evaluation.passedTests} / {evaluation.totalTests}
                      </p>
                      <p className="text-sm text-gray-400">
                        {Math.round(
                          (evaluation.passedTests / evaluation.totalTests) * 100
                        )}
                        %
                      </p>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{
                          width: `${
                            (evaluation.passedTests / evaluation.totalTests) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  생성일: {evaluation.createdDate}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full border-white/10 hover:bg-white/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                상세보기
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvaluations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
