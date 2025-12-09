import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function AnomalyDetectionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Mock data for anomaly detections
  const anomalies = [
    {
      id: 1,
      anomalyId: "anom_001",
      detectionName: "WISE LLM 응답 시간 이상",
      modelName: "WISE LLM",
      anomalyType: "performance",
      severity: "high",
      status: "resolved",
      description: "평균 응답 시간이 정상 범위를 초과함",
      detectedAt: "2025.01.25 14:30:00",
      resolvedAt: "2025.01.25 15:45:00",
      impact: "API 응답 지연",
    },
    {
      id: 2,
      anomalyId: "anom_002",
      detectionName: "Konan-LLM 에러율 증가",
      modelName: "KONANENT-11",
      anomalyType: "error_rate",
      severity: "critical",
      status: "investigating",
      description: "에러율이 5%를 초과함",
      detectedAt: "2025.01.26 10:15:00",
      resolvedAt: null,
      impact: "서비스 안정성 저하",
    },
    {
      id: 3,
      anomalyId: "anom_003",
      detectionName: "믿음 2.0 Pro GPU 메모리 누수",
      modelName: "믿음 2.0 Pro",
      anomalyType: "resource",
      severity: "medium",
      status: "investigating",
      description: "GPU 메모리 사용량이 지속적으로 증가 중",
      detectedAt: "2025.01.26 09:00:00",
      resolvedAt: null,
      impact: "시스템 성능 저하",
    },
    {
      id: 4,
      anomalyId: "anom_004",
      detectionName: "Solar Pro2 응답 품질 저하",
      modelName: "Solar Pro2",
      anomalyType: "quality",
      severity: "medium",
      status: "resolved",
      description: "응답 품질 점수가 임계값 이하로 하락",
      detectedAt: "2025.01.24 16:20:00",
      resolvedAt: "2025.01.25 08:30:00",
      impact: "사용자 만족도 감소",
    },
  ];

  const filteredAnomalies = anomalies.filter((anomaly) => {
    const matchesSearch =
      anomaly.detectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anomaly.anomalyId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === null || anomaly.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300";
      case "high":
        return "bg-orange-500/20 text-orange-300";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300";
      case "low":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical":
        return "긴급";
      case "high":
        return "높음";
      case "medium":
        return "중간";
      case "low":
        return "낮음";
      default:
        return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/20 text-green-300";
      case "investigating":
        return "bg-yellow-500/20 text-yellow-300";
      case "pending":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "resolved":
        return "해결됨";
      case "investigating":
        return "조사 중";
      case "pending":
        return "대기 중";
      default:
        return status;
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    switch (type) {
      case "performance":
        return "성능";
      case "error_rate":
        return "에러율";
      case "resource":
        return "리소스";
      case "quality":
        return "품질";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            이상 탐지 관리
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            총 {filteredAnomalies.length}개의 이상 탐지
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="이상 탐지명, ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === null ? "default" : "outline"}
              onClick={() => setFilterStatus(null)}
              className={filterStatus === null ? "bg-blue-600" : ""}
            >
              전체
            </Button>
            <Button
              variant={filterStatus === "investigating" ? "default" : "outline"}
              onClick={() => setFilterStatus("investigating")}
              className={filterStatus === "investigating" ? "bg-yellow-600" : ""}
            >
              조사 중
            </Button>
            <Button
              variant={filterStatus === "resolved" ? "default" : "outline"}
              onClick={() => setFilterStatus("resolved")}
              className={filterStatus === "resolved" ? "bg-green-600" : ""}
            >
              해결됨
            </Button>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        {filteredAnomalies.map((anomaly) => (
          <Card
            key={anomaly.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {anomaly.detectionName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        ID: {anomaly.anomalyId}
                      </p>
                    </div>
                    {anomaly.status === "resolved" ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>

                  <p className="text-sm text-gray-300">
                    {anomaly.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getSeverityColor(anomaly.severity)}>
                      {getSeverityLabel(anomaly.severity)}
                    </Badge>
                    <Badge className={getStatusColor(anomaly.status)}>
                      {getStatusLabel(anomaly.status)}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">
                      {getAnomalyTypeLabel(anomaly.anomalyType)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-400">모델</p>
                      <p className="font-semibold text-white">
                        {anomaly.modelName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">영향</p>
                      <p className="font-semibold text-white text-xs">
                        {anomaly.impact}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">탐지 시간</p>
                      <p className="font-semibold text-white text-xs">
                        {anomaly.detectedAt}
                      </p>
                    </div>
                  </div>

                  {anomaly.resolvedAt && (
                    <p className="text-xs text-gray-500">
                      해결 시간: {anomaly.resolvedAt}
                    </p>
                  )}
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

      {filteredAnomalies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
