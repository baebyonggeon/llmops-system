import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ModelManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  // Mock data for models
  const models = [
    {
      id: 1,
      modelId: "kai_gg_Id",
      modelName: "믿음 2.0 Pro",
      releaseDate: "2025.09.20",
      description: "한국어 특화 KT 대형 언어모델",
      isActive: true,
      cpu: 16,
      memory: 24,
      gpu: 2,
      gpuMemory: 160,
    },
    {
      id: 2,
      modelId: "wise_llm",
      modelName: "WISE LLM",
      releaseDate: "2025.09.01",
      description: "업무 특화 모델",
      isActive: true,
      cpu: 12,
      memory: 20,
      gpu: 2,
      gpuMemory: 120,
    },
    {
      id: 3,
      modelId: "konan_ent",
      modelName: "KONANENT-11",
      releaseDate: "2025.08.15",
      description: "법률 특화 모델",
      isActive: false,
      cpu: 8,
      memory: 16,
      gpu: 1,
      gpuMemory: 80,
    },
  ];

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.modelId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterActive === null || model.isActive === filterActive;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              모델 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredModels.length}개의 모델
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 모델 등록
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="모델명, 모델 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterActive === null ? "default" : "outline"}
              onClick={() => setFilterActive(null)}
              className={filterActive === null ? "bg-blue-600" : ""}
            >
              전체
            </Button>
            <Button
              variant={filterActive === true ? "default" : "outline"}
              onClick={() => setFilterActive(true)}
              className={filterActive === true ? "bg-green-600" : ""}
            >
              활성
            </Button>
            <Button
              variant={filterActive === false ? "default" : "outline"}
              onClick={() => setFilterActive(false)}
              className={filterActive === false ? "bg-gray-600" : ""}
            >
              비활성
            </Button>
          </div>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-3">
        {filteredModels.map((model) => (
          <Card
            key={model.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {model.modelName}
                      </h3>
                      <p className="text-sm text-gray-400">ID: {model.modelId}</p>
                    </div>
                    <Badge
                      className={
                        model.isActive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-gray-500/20 text-gray-300"
                      }
                    >
                      {model.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-300">{model.description}</p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-400">CPU</p>
                      <p className="font-semibold text-white">{model.cpu}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Memory</p>
                      <p className="font-semibold text-white">{model.memory}GB</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">GPU</p>
                      <p className="font-semibold text-white">{model.gpu}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">GPU Memory</p>
                      <p className="font-semibold text-white">
                        {model.gpuMemory}GB
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    출시일: {model.releaseDate}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
