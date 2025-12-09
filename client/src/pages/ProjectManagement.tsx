import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Edit2 } from "lucide-react";
import { useState } from "react";

export default function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data for projects
  const projects = [
    {
      id: 1,
      projectId: "proj_001",
      projectName: "AI 챗봇 개발",
      description: "고객 지원용 AI 챗봇 시스템 구축",
      admin: "홍길동",
      isActive: true,
      isCreated: true,
      createdDate: "2025.01.15",
    },
    {
      id: 2,
      projectId: "proj_002",
      projectName: "문서 분석 시스템",
      description: "법률 문서 자동 분석 및 요약",
      admin: "김철수",
      isActive: true,
      isCreated: false,
      createdDate: "2025.01.10",
    },
    {
      id: 3,
      projectId: "proj_003",
      projectName: "음성 인식 서비스",
      description: "실시간 음성 인식 및 번역",
      admin: "이영희",
      isActive: false,
      isCreated: true,
      createdDate: "2024.12.20",
    },
  ];

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.projectId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 blueprint-grid">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              프로젝트 관리
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              총 {filteredProjects.length}개의 프로젝트
            </p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            새 프로젝트
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="프로젝트명, ID로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    {project.projectName}
                  </h3>
                  <p className="text-sm text-gray-400">ID: {project.projectId}</p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className={
                      project.isActive
                        ? "bg-green-500/20 text-green-300"
                        : "bg-gray-500/20 text-gray-300"
                    }
                  >
                    {project.isActive ? "활성" : "비활성"}
                  </Badge>
                  <Badge
                    className={
                      project.isCreated
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }
                  >
                    {project.isCreated ? "생성됨" : "저장됨"}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-300">{project.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-gray-400">관리자</p>
                  <p className="font-semibold text-white">{project.admin}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-400">생성일</p>
                  <p className="font-semibold text-white">{project.createdDate}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 hover:bg-white/10"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  상세보기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 hover:bg-white/10"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  수정
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
