# LLMOps System TODO

## Phase 3: 데이터베이스 스키마 구현
- [x] models 테이블 생성 (모델 정보, 리소스 사양)
- [x] images 테이블 생성 (학습/추론 이미지)
- [x] projects 테이블 생성 (프로젝트 정보)
- [x] deployments 테이블 생성 (모델 배포 이력)
- [x] trainings 테이블 생성 (모델 학습 이력)
- [x] apis 테이블 생성 (API 정보)
- [x] apiKeys 테이블 생성 (API 키)
- [x] evaluations 테이블 생성 (모델 평가)
- [x] anomalyDetections 테이블 생성 (이상 탐지)
- [x] 마이그레이션 실행 (pnpm db:push)

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
- [ ] Vitest 테스트 작성

## Phase 5: 프론트엔드 UI 구현
- [x] 디자인 시스템 구축 (블루프린트 테마, 색상, 타이포그래피)
- [x] DashboardLayout 커스터마이징 (LLMOps 메뉴)
- [x] 대시보드 페이지 (GPU/CPU/Memory 현황, 배포 모델, API 호출 통계)
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
- [x] 학습 메트릭 데이터 구조 설계 (GPU, Loss, Epoch, Accuracy)
- [x] 실시간 데이터 생성 및 전송 로직 구현
- [x] Recharts를 이용한 동적 그래프 컴포넌트 구현
- [x] 학습 상세 페이지 모니터링 대시보드 구현
- [x] 실시간 메트릭 업데이트 훅 (useTrainingMetrics) 구현
- [x] 성능 최적화 (데이터 스트리밍, 메모리 관리)
- [x] 실시간 모니터링 기능 테스트 (11개 테스트 총 통과)


## Phase 9: 학습 완료 및 조건 기반 알림 시스템
- [x] 알림 데이터베이스 테이블 설계
- [x] 데이터베이스 마이그레이션 실행
- [x] 백엔드 알림 관리 시스템 구현
- [x] 조건 평가 엔진 구현
- [x] 알림 전송 로직 구현
- [x] 프론트엔드 알림 UI 컴포넌트 구현
- [x] 알림 센터 페이지 구현
- [x] 대시보드 내 알림 중심 연동
- [x] 알림 시스템 테스트
