import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ImageManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  // Mock data for images
  const images = [
    {
      id: 1,
      imageId: "img_001",
      imageName: "WISE LLM-vLLM",
      releaseDate: "2025.09.01",
      description: "업무 특화 모델",
      imageSizeGB: 120,
      imageType: "inference",
      registryHost: "192.0.0.01:8080",
      registryProject: "bai",
      registryTag: "wise-llm-latest",
      isActive: true,
    },
    {
      id: 2,
      imageId: "img_002",
      imageName: "Konan-vLLM",
      releaseDate: "2025.09.01",
      description: "법률 특화 모델",
      imageSizeGB: 50,
      imageType: "inference",
      registryHost: "192.0.0.01:8080",
      registryProject: "bai",
      registryTag: "konan-latest",
      isActive: true,
    },
    {
      id: 3,
      imageId: "img_003",
      imageName: "Midm-vLLM-Train",
      releaseDate: "2025.09.01",
      description: "한국어 특화 학습 이미지",
      imageSizeGB: 80,
      imageType: "training",
      registryHost: "192.0.0.01:8080",
      registryProject: "bai",
      registryTag: "midm-train-latest",
      isActive: true,
    },
    {
      id: 4,
      imageId: "img_004",
      imageName: "Solar-pro2-vLLM",
      releaseDate: "2025.08.20",
      description: "특화 모델",
      imageSizeGB: 70,
      imageType: "inference",
      registryHost: "192.0.0.01:8080",
      registryProject: "bai",
      registryTag: "solar-pro2-latest",
      isActive: false,
    },
  ];

  const filteredImages = images.filter((image) => {
    const matchesSearch =
      image.imageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.imageId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === null || image.imageType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getImageTypeLabel = (type: string) => {
    return type === "inference" ? "추론" : "학습";
  };

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              이미지 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredImages.length}개의 이미지
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 이미지 등록
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="이미지명, ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === null ? "default" : "outline"}
              onClick={() => setFilterType(null)}
              className={filterType === null ? "bg-blue-600" : ""}
            >
              전체
            </Button>
            <Button
              variant={filterType === "inference" ? "default" : "outline"}
              onClick={() => setFilterType("inference")}
              className={filterType === "inference" ? "bg-green-600" : ""}
            >
              추론
            </Button>
            <Button
              variant={filterType === "training" ? "default" : "outline"}
              onClick={() => setFilterType("training")}
              className={filterType === "training" ? "bg-purple-600" : ""}
            >
              학습
            </Button>
          </div>
        </div>
      </div>

      {/* Images Grid */}
      <div className="space-y-3">
        {filteredImages.map((image) => (
          <Card
            key={image.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {image.imageName}
                      </h3>
                      <p className="text-sm text-gray-400">ID: {image.imageId}</p>
                    </div>
                    <Badge
                      className={
                        image.imageType === "inference"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-purple-500/20 text-purple-300"
                      }
                    >
                      {getImageTypeLabel(image.imageType)}
                    </Badge>
                    <Badge
                      className={
                        image.isActive
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-gray-500/20 text-gray-300"
                      }
                    >
                      {image.isActive ? "활성" : "비활성"}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-300">{image.description}</p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-400">크기</p>
                      <p className="font-semibold text-white">
                        {image.imageSizeGB}GB
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Registry Host</p>
                      <p className="font-semibold text-white text-xs">
                        {image.registryHost}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400">Tag</p>
                      <p className="font-semibold text-white text-xs">
                        {image.registryTag}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    출시일: {image.releaseDate}
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

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
