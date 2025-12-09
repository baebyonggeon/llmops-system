import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Copy } from "lucide-react";
import { useState } from "react";

export default function APIManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"apis" | "keys">("apis");

  // Mock data for APIs
  const apis = [
    {
      id: 1,
      apiId: "api_001",
      apiName: "회의 관리 API",
      description: "회의 내용 분석 및 요약",
      endpoint: "/api/meeting-analysis",
      status: "active",
      callCount: 34208964,
      createdDate: "2025.01.10",
    },
    {
      id: 2,
      apiId: "api_002",
      apiName: "업무지원 API",
      description: "업무 자동화 및 지원",
      endpoint: "/api/task-support",
      status: "active",
      callCount: 28765432,
      createdDate: "2025.01.05",
    },
    {
      id: 3,
      apiId: "api_003",
      apiName: "법률 상담 API",
      description: "법률 문서 분석 및 상담",
      endpoint: "/api/legal-advice",
      status: "inactive",
      callCount: 0,
      createdDate: "2024.12.20",
    },
  ];

  // Mock data for API Keys
  const apiKeys = [
    {
      id: 1,
      keyId: "key_001",
      keyName: "Production Key",
      apiName: "회의 관리 API",
      status: "active",
      usageCount: 1000000,
      usageLimit: 5000000,
      expiryDate: "2026.01.10",
    },
    {
      id: 2,
      keyId: "key_002",
      keyName: "Development Key",
      apiName: "업무지원 API",
      status: "active",
      usageCount: 50000,
      usageLimit: 500000,
      expiryDate: "2025.06.05",
    },
    {
      id: 3,
      keyId: "key_003",
      keyName: "Test Key",
      apiName: "법률 상담 API",
      status: "expired",
      usageCount: 100000,
      usageLimit: 100000,
      expiryDate: "2024.12.31",
    },
  ];

  const filteredApis = apis.filter((api) =>
    api.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.apiId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKeys = apiKeys.filter((key) =>
    key.keyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.keyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-300";
      case "inactive":
        return "bg-gray-500/20 text-gray-300";
      case "expired":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "활성";
      case "inactive":
        return "비활성";
      case "expired":
        return "만료됨";
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
              API 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              API 및 API 키 관리
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            {activeTab === "apis" ? "새 API" : "새 API 키"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab("apis")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "apis"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            API 목록
          </button>
          <button
            onClick={() => setActiveTab("keys")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "keys"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            API 키
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder={
              activeTab === "apis"
                ? "API명, ID로 검색..."
                : "키명, ID로 검색..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* APIs Tab */}
      {activeTab === "apis" && (
        <div className="space-y-3">
          {filteredApis.map((api) => (
            <Card
              key={api.id}
              className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {api.apiName}
                        </h3>
                        <p className="text-sm text-gray-400">ID: {api.apiId}</p>
                      </div>
                      <Badge className={getStatusColor(api.status)}>
                        {getStatusLabel(api.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-300">{api.description}</p>

                    <div className="flex items-center gap-2 bg-white/5 rounded px-3 py-2">
                      <code className="text-xs text-gray-300 font-mono">
                        {api.endpoint}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-gray-400">호출 건수</p>
                        <p className="font-semibold text-white">
                          {api.callCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-400">생성일</p>
                        <p className="font-semibold text-white">
                          {api.createdDate}
                        </p>
                      </div>
                    </div>
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
      )}

      {/* API Keys Tab */}
      {activeTab === "keys" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  키명
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  API
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  상태
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  사용량
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  만료일
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-300">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.map((key) => (
                <tr
                  key={key.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{key.keyName}</p>
                      <p className="text-xs text-gray-500">ID: {key.keyId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">{key.apiName}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(key.status)}>
                      {getStatusLabel(key.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">
                        {key.usageCount.toLocaleString()} /{" "}
                        {key.usageLimit.toLocaleString()}
                      </p>
                      <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(key.usageCount / key.usageLimit) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {key.expiryDate}
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
      )}

      {(activeTab === "apis" ? filteredApis : filteredKeys).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
