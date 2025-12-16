# LLMOps System TODO

## Phase 1: 화면설계서 PDF 파일 분석 및 요구사항 도출
- [x] PDF 파일 분석
- [x] 요구사항 정리
- [x] 기능 목록 작성

## Phase 2: 데이터베이스 스키마 설계 및 개발 계획 수립
- [x] ERD 분석
- [x] 스키마 설계
- [x] 개발 계획 수립

## Phase 3: 데이터베이스 스키마 구현 및 마이그레이션
- [x] MySQL 스키마 구현 (14개 테이블)
- [x] 데이터베이스 마이그레이션 실행
- [x] 관계 및 외래키 검증

## Phase 4: 백엔드 API 개발
- [x] 모델 관리 API (list, getById)
- [x] 이미지 관리 API (list, getById)
- [x] 프로젝트 관리 API (list, getById)
- [x] 배포 관리 API (list, getById)
- [x] 학습 관리 API (list, getById)
- [x] API 관리 API (list, getById)
- [x] API 키 관리 API (list, getById)
- [x] 평가 관리 API (list, getById)
- [x] 이상 탐지 API (list, getById)
- [x] 자원 그룹 API (list, getById)

## Phase 5: 프론트엔드 UI 구현
- [x] 디자인 시스템 구축 (블루프린트 테마)
- [x] DashboardLayout 커스터마이징
- [x] 대시보드 페이지 (GPU/CPU/Memory 현황)
- [x] 모델 관리 페이지 (리스트, 검색, 필터)
- [x] 이미지 관리 페이지 (리스트, 등록, 수정)
- [x] 프로젝트 관리 페이지 (리스트, 상세, 추가/수정)
- [x] 모델 배포 관리 페이지 (리스트, 상세 조회)
- [x] 모델 학습 관리 페이지 (리스트, 모니터링)
- [x] API 관리 페이지 (리스트, API 키 관리)
- [x] 평가 관리 페이지 (리스트, 생성, 조회)
- [x] 이상 탐지 관리 페이지 (리스트, 처리)
- [x] App.tsx 라우팅 설정

## Phase 6: 시스템 통합 및 테스트
- [x] 전체 기능 통합 테스트
- [x] UI/UX 검증
- [x] TypeScript 컴파일 검증
- [x] 개발 서버 정상 작동 확인

## Phase 7: 배포 및 최종 결과물 전달
- [x] 최종 체크포인트 생성
- [x] 사용자에게 결과물 전달

## Phase 8: 실시간 학습 모니터링 기능 추가
- [x] 백엔드 WebSocket 서버 구현 (Socket.IO)
- [x] 학습 메트릭 데이터 구조 설계
- [x] 실시간 데이터 생성 및 전송 로직 구현
- [x] Recharts를 이용한 동적 그래프 컴포넌트 구현
- [x] 학습 상세 페이지 모니터링 대시보드 구현
- [x] 실시간 메트릭 업데이트 훅 (useTrainingMetrics) 구현
- [x] 성능 최적화 (데이터 스트리밍, 메모리 관리)
- [x] 실시간 모니터링 기능 테스트 (11개 테스트 통과)

## Phase 9: 학습 완료 및 조건 기반 알림 시스템
- [x] 알림 데이터베이스 테이블 설계
- [x] 데이터베이스 마이그레이션 실행
- [x] 백엔드 알림 관리 시스템 구현
- [x] 조건 평가 엔진 구현
- [x] 알림 전송 로직 구현
- [x] 프론트엔드 알림 UI 컴포넌트 구현
- [x] 알림 센터 페이지 구현
- [x] 대시보드 내 알림 중심 연동
- [x] 알림 시스템 테스트 (30개 테스트 통과)

## Phase 10: PostgreSQL 기반 ERD 매칭 시스템 재구현
- [x] PostgreSQL Drizzle ORM 스키마 변환 (14개 테이블)
- [x] 데이터베이스 마이그레이션 실행 (9개 핵심 테이블 생성)
- [x] 백엔드 코드 PostgreSQL 호환성 업데이트
- [x] 프론트엔드 코드 PostgreSQL 스키마에 맞게 수정
- [x] PostgreSQL 설치 및 서버 실행
- [x] 개발 서버 재시작 및 정상 작동 확인

## Phase 11: Docker 컨테이너 패키징 및 로컬 PC 배포
- [x] Dockerfile 작성 (Node.js 22 Alpine 기반 멀티 스테이지 빌드)
- [x] docker-compose.yml 작성 (PostgreSQL + 애플리케이션)
- [x] init-db.sql 작성 (데이터베이스 자동 초기화 스크립트)
- [x] .dockerignore 작성
- [x] DOCKER_SETUP.md 작성 (상세 설치 가이드)
- [x] 환경 변수 설정 예시 포함
- [x] 문제 해결 가이드 및 모니터링 명령어 포함
- [x] 클라우드 배포 가이드 포함 (AWS ECS 등)
- [x] 로컬 PC의 Docker Desktop에서 즉시 실행 가능

## Phase 12: AWS 프로덕션 배포 구성
- [x] Terraform 코드 작성 (main.tf, variables.tf)
- [x] Terraform 모듈 구조 설계
- [x] terraform.tfvars.example 작성
- [x] GitHub Actions CI/CD 파이프라인 작성 (deploy-aws.yml)
- [x] AWS 배포 가이드 작성 (상세 단계별)
- [ ] Terraform 모듈 완성 (각 모듈 세부 사항 구현)
- [ ] ECS 작업 정의 파일 생성
- [ ] AWS 배포 최종 검증
