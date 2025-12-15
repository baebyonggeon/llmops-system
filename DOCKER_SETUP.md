# LLMOps System - Docker 설정 및 실행 가이드

이 가이드는 로컬 PC의 Docker Desktop에서 LLMOps 시스템을 실행하는 방법을 설명합니다.

---

## 📋 사전 요구사항

### 1. Docker Desktop 설치

**Windows/Mac:**
- [Docker Desktop 다운로드](https://www.docker.com/products/docker-desktop)
- 설치 후 Docker Desktop 애플리케이션 실행

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
```

### 2. 시스템 요구사항

- **CPU**: 최소 2개 코어 (권장 4개 이상)
- **메모리**: 최소 4GB (권장 8GB 이상)
- **디스크**: 최소 10GB 여유 공간
- **Docker**: 최신 버전 (20.10+)
- **Docker Compose**: 최신 버전 (2.0+)

---

## 🚀 빠른 시작 (3단계)

### 1단계: 소스 코드 다운로드

```bash
# 압축 파일 해제
tar -xzf llmops-system-source.tar.gz
cd llmops-system
```

### 2단계: Docker 이미지 빌드

```bash
# Docker 이미지 빌드 (5-10분 소요)
docker-compose build
```

### 3단계: 애플리케이션 실행

```bash
# 컨테이너 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f app
```

**접속 URL:**
- 애플리케이션: http://localhost:3000
- PostgreSQL: localhost:5432

---

## 🔧 상세 설정

### 환경 변수 설정

`.env.docker` 파일을 생성하여 환경 변수를 설정합니다:

```bash
# .env.docker 파일 생성
cat > .env.docker << 'EOF'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=llm1234!
POSTGRES_DB=llmops

# Application
NODE_ENV=production
PORT=3000

# OAuth (필요시 수정)
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
JWT_SECRET=your-secret-key-change-in-production

# Owner Info
OWNER_OPEN_ID=owner
OWNER_NAME=Owner

# API Keys (필요시 수정)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# App Info
VITE_APP_TITLE=LLMOps System
VITE_APP_LOGO=/logo.svg
EOF
```

### docker-compose.yml 수정

환경 변수를 외부 파일에서 로드하도록 수정:

```yaml
services:
  app:
    env_file:
      - .env.docker
```

---

## 📦 Docker 명령어

### 컨테이너 관리

```bash
# 컨테이너 시작
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 컨테이너 재시작
docker-compose restart

# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f app

# 특정 컨테이너 로그
docker-compose logs -f postgres
```

### 데이터베이스 관리

```bash
# PostgreSQL 접속
docker-compose exec postgres psql -U postgres -d llmops

# 데이터베이스 백업
docker-compose exec postgres pg_dump -U postgres llmops > backup.sql

# 데이터베이스 복원
docker-compose exec -T postgres psql -U postgres llmops < backup.sql

# 데이터 초기화 (모든 데이터 삭제)
docker volume rm llmops-system_postgres_data
docker-compose up -d
```

### 이미지 관리

```bash
# 이미지 빌드
docker-compose build

# 이미지 빌드 (캐시 무시)
docker-compose build --no-cache

# 이미지 목록
docker images | grep llmops

# 이미지 삭제
docker rmi llmops-system-app
```

---

## 🐛 문제 해결

### 포트 충돌 오류

**문제:** `bind: address already in use`

**해결책:**
```bash
# 포트 변경 (docker-compose.yml 수정)
ports:
  - "3001:3000"  # 3000 → 3001로 변경

# 또는 기존 프로세스 종료
lsof -i :3000
kill -9 <PID>
```

### 데이터베이스 연결 오류

**문제:** `Failed to connect to database`

**해결책:**
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# PostgreSQL 로그 확인
docker-compose logs postgres

# 컨테이너 재시작
docker-compose restart postgres

# 데이터 초기화
docker volume rm llmops-system_postgres_data
docker-compose up -d
```

### 메모리 부족

**문제:** `OOMKilled` 또는 메모리 오류

**해결책:**
```bash
# Docker Desktop 메모리 설정 증가
# Windows/Mac: Docker Desktop → Preferences → Resources → Memory를 8GB 이상으로 설정

# 또는 컨테이너 메모리 제한 설정 (docker-compose.yml)
services:
  app:
    mem_limit: 2g
  postgres:
    mem_limit: 1g
```

### 빌드 실패

**문제:** `npm install` 또는 `pnpm install` 실패

**해결책:**
```bash
# 캐시 무시하고 재빌드
docker-compose build --no-cache

# 또는 Dockerfile 직접 빌드
docker build -t llmops-system-app:latest .
```

---

## 📊 모니터링

### 리소스 사용량 확인

```bash
# 실시간 리소스 사용량
docker stats

# 컨테이너별 상세 정보
docker-compose exec app node -e "console.log(require('os').totalmem() / 1024 / 1024 / 1024 + ' GB')"
```

### 헬스 체크

```bash
# 애플리케이션 헬스 체크
curl http://localhost:3000

# 데이터베이스 헬스 체크
docker-compose exec postgres pg_isready -U postgres
```

---

## 🔐 보안 설정

### 프로덕션 배포

```bash
# 1. 환경 변수 보안 강화
# .env.docker 파일의 모든 민감한 정보 변경

# 2. 이미지 스캔
docker scan llmops-system-app

# 3. 최신 보안 패치 적용
docker-compose build --no-cache

# 4. 네트워크 격리
# docker-compose.yml에서 네트워크 설정 확인
```

### 데이터 보호

```bash
# 데이터베이스 백업 자동화
# crontab -e 또는 Windows Task Scheduler에서 설정
0 2 * * * cd /path/to/llmops-system && docker-compose exec -T postgres pg_dump -U postgres llmops > /backup/llmops-$(date +\%Y\%m\%d).sql
```

---

## 📈 성능 최적화

### 빌드 최적화

```dockerfile
# Dockerfile에서 멀티 스테이지 빌드 사용 (이미 적용됨)
# 불필요한 파일 제거 (.dockerignore 확인)
```

### 런타임 최적화

```yaml
# docker-compose.yml
services:
  app:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## 🚢 배포 가이드

### Docker Hub에 푸시

```bash
# 로그인
docker login

# 이미지 태그
docker tag llmops-system-app:latest username/llmops-system:latest

# 푸시
docker push username/llmops-system:latest
```

### 클라우드 배포

**AWS ECS:**
```bash
# ECR 푸시
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag llmops-system-app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/llmops-system:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/llmops-system:latest
```

---

## 📞 지원

문제가 발생하면:

1. 로그 확인: `docker-compose logs -f`
2. 컨테이너 상태 확인: `docker-compose ps`
3. 네트워크 확인: `docker network ls`
4. 볼륨 확인: `docker volume ls`

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
