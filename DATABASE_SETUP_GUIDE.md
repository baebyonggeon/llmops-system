# 데이터베이스 설정 가이드

## 개요

이 가이드는 RDS PostgreSQL 데이터베이스에 초기 스키마를 생성하고 샘플 데이터를 삽입하는 방법을 설명합니다.

## RDS 데이터베이스 정보

- **Endpoint**: `prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432`
- **Database**: `llmops`
- **Username**: `postgres`
- **Password**: `llm1234!`
- **Engine**: PostgreSQL 16

## 중요 사항

⚠️ **RDS 인스턴스는 Private 서브넷에 있습니다**

RDS는 보안을 위해 Private 서브넷에 배치되어 있어 인터넷에서 직접 접근할 수 없습니다. 다음 방법 중 하나를 사용하여 연결해야 합니다:

1. **ECS 컨테이너 내부에서 실행** (권장)
2. **Bastion Host를 통한 연결**
3. **VPN 연결**

## 방법 1: ECS 컨테이너에서 마이그레이션 실행 (권장)

### 1단계: Docker 이미지 빌드 및 푸시

GitHub Actions를 통해 자동으로 실행되거나, 로컬에서 수동으로 실행할 수 있습니다:

```bash
# AWS ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  083281668815.dkr.ecr.ap-northeast-2.amazonaws.com

# Docker 이미지 빌드
docker build -t llmops-system .

# 이미지 태그
docker tag llmops-system:latest \
  083281668815.dkr.ecr.ap-northeast-2.amazonaws.com/prod-llmops-app:latest

# ECR에 푸시
docker push 083281668815.dkr.ecr.ap-northeast-2.amazonaws.com/prod-llmops-app:latest
```

### 2단계: ECS 태스크에서 마이그레이션 실행

```bash
# ECS 클러스터에서 실행 중인 태스크 ID 확인
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2

# 태스크 ID를 사용하여 컨테이너에 접속
aws ecs execute-command \
  --cluster prod-llmops-cluster \
  --task <TASK_ID> \
  --container llmops-app \
  --interactive \
  --command "/bin/sh" \
  --region ap-northeast-2
```

### 3단계: 컨테이너 내부에서 마이그레이션 실행

```bash
# 스키마 생성 (Drizzle Push)
pnpm db:push

# 샘플 데이터 삽입
node scripts/seed-database.mjs
```

## 방법 2: Bastion Host를 통한 연결

### 1단계: Bastion Host 생성

```bash
# Terraform에 Bastion Host 추가
# terraform/bastion.tf 파일 생성
```

```hcl
resource "aws_instance" "bastion" {
  ami           = "ami-0c9c942bd7bf113a2" # Amazon Linux 2023
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public[0].id
  
  vpc_security_group_ids = [aws_security_group.bastion.id]
  
  key_name = "your-key-pair-name" # SSH 키 페어 이름
  
  tags = {
    Name = "${var.environment}-llmops-bastion"
  }
}

resource "aws_security_group" "bastion" {
  name        = "${var.environment}-llmops-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_IP/32"] # 본인 IP로 변경
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS 보안 그룹에 Bastion 허용 추가
resource "aws_security_group_rule" "rds_from_bastion" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds.id
  source_security_group_id = aws_security_group.bastion.id
}
```

### 2단계: SSH 터널링을 통한 연결

```bash
# SSH 터널 생성
ssh -i your-key.pem -L 5432:prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432 \
  ec2-user@<BASTION_PUBLIC_IP>

# 다른 터미널에서 로컬 연결
export DATABASE_URL="postgresql://postgres:llm1234!@localhost:5432/llmops"
cd /path/to/llmops-system

# 스키마 생성
pnpm db:push

# 샘플 데이터 삽입
node scripts/seed-database.mjs
```

## 방법 3: 수동 SQL 실행

### 1단계: SQL 마이그레이션 파일 생성

```bash
# Drizzle Kit으로 SQL 파일 생성
pnpm drizzle-kit generate
```

생성된 SQL 파일은 `drizzle/migrations` 디렉토리에 저장됩니다.

### 2단계: ECS 태스크에서 SQL 실행

```bash
# ECS 컨테이너에 접속
aws ecs execute-command \
  --cluster prod-llmops-cluster \
  --task <TASK_ID> \
  --container llmops-app \
  --interactive \
  --command "/bin/sh" \
  --region ap-northeast-2

# 컨테이너 내부에서
psql $DATABASE_URL < drizzle/migrations/0000_initial.sql
```

## 데이터베이스 스키마

### 주요 테이블

1. **sys_com_cd**: 공통 코드 테이블
2. **mbr_bas**: 회원 기본 정보
3. **pjt_bas**: 프로젝트 기본 정보
4. **pjt_mbr_aut_map**: 프로젝트-회원 권한 매핑
5. **llm_bas**: LLM 모델 기본 정보
6. **mdl_catalog**: 모델 카탈로그
7. **llm_image**: 학습/추론 이미지 정보
8. **dp_bas**: 배포 기본 정보
9. **api_bas**: API 기본 정보
10. **apikey_bas**: API 키 관리
11. **api_usage_realtime**: API 실시간 사용량
12. **api_access_stat_daily**: API 일별 통계
13. **notifications**: 알림 정보
14. **alert_conditions**: 알림 조건 설정

## 샘플 데이터

`scripts/seed-database.mjs` 스크립트는 다음 샘플 데이터를 삽입합니다:

### 회원 (3명)
- **admin@llmops.com**: 시스템 관리자
- **dev1@llmops.com**: 개발자
- **user1@llmops.com**: 일반 사용자

### 프로젝트 (3개)
- **GPT-4 Chatbot Development**: GPT-4 기반 챗봇 개발
- **Image Classification System**: 이미지 분류 시스템
- **Sentiment Analysis API**: 감정 분석 API

### 모델 (3개)
- **GPT-4-Turbo**: 최신 GPT-4 Turbo 모델
- **ResNet-50**: 이미지 분류용 ResNet-50
- **BERT-Base**: 감정 분석용 BERT

### 배포 (2개)
- **GPT-4-Production**: 프로덕션 GPT-4 배포
- **ResNet-Staging**: 스테이징 ResNet 배포

### API (2개)
- **Chat Completion API**: GPT-4 채팅 완료 API
- **Image Classification API**: 이미지 분류 API

### API 키 (2개)
- **Production Key 1**: 프로덕션 환경용 API 키
- **Staging Key 1**: 스테이징 환경용 API 키

## 검증

### 데이터베이스 연결 테스트

```bash
# ECS 컨테이너 내부에서
psql $DATABASE_URL -c "SELECT version();"
```

### 테이블 확인

```sql
-- 모든 테이블 목록
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 각 테이블의 레코드 수
SELECT 
  'sys_com_cd' as table_name, COUNT(*) as count FROM sys_com_cd
UNION ALL
SELECT 'mbr_bas', COUNT(*) FROM mbr_bas
UNION ALL
SELECT 'pjt_bas', COUNT(*) FROM pjt_bas
UNION ALL
SELECT 'llm_bas', COUNT(*) FROM llm_bas
UNION ALL
SELECT 'dp_bas', COUNT(*) FROM dp_bas
UNION ALL
SELECT 'api_bas', COUNT(*) FROM api_bas
UNION ALL
SELECT 'apikey_bas', COUNT(*) FROM apikey_bas;
```

### 샘플 데이터 조회

```sql
-- 프로젝트 목록
SELECT pjt_id, pjt_nm, pjt_dscrt, state_cd 
FROM pjt_bas 
ORDER BY cret_dt DESC;

-- 모델 목록
SELECT llm_id, llm_nm, llm_type, llm_ver, llm_sttus 
FROM llm_bas 
ORDER BY cret_dt DESC;

-- 배포 목록
SELECT dp_id, dp_nm, dp_sttus, dp_url 
FROM dp_bas 
ORDER BY cret_dt DESC;

-- API 목록
SELECT api_id, api_nm, api_url, api_mthd, api_sttus 
FROM api_bas 
ORDER BY cret_dt DESC;
```

## 문제 해결

### 연결 타임아웃

**증상**: `connection timed out`

**원인**: RDS가 Private 서브넷에 있어 직접 접근 불가

**해결**: 
- ECS 컨테이너 내부에서 실행
- Bastion Host 사용
- VPN 연결 설정

### 인증 실패

**증상**: `password authentication failed`

**원인**: 잘못된 데이터베이스 자격증명

**해결**:
```bash
# Terraform output에서 RDS 엔드포인트 확인
cd terraform
terraform output rds_endpoint

# 올바른 비밀번호 사용
# Username: postgres
# Password: llm1234!
```

### SSL 연결 오류

**증상**: `SSL connection error`

**원인**: RDS는 기본적으로 SSL 연결 요구

**해결**:
```bash
# SSL 비활성화 (개발 환경만)
export DATABASE_URL="postgresql://postgres:llm1234!@prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432/llmops?sslmode=disable"

# 또는 SSL 인증서 사용 (프로덕션)
export DATABASE_URL="postgresql://postgres:llm1234!@prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432/llmops?sslmode=require"
```

## 보안 권장사항

1. **비밀번호 변경**: 프로덕션 환경에서는 강력한 비밀번호 사용
2. **AWS Secrets Manager**: 데이터베이스 자격증명을 Secrets Manager에 저장
3. **IAM 인증**: RDS IAM 인증 사용 고려
4. **감사 로그**: RDS 감사 로그 활성화
5. **백업**: 자동 백업 활성화 (현재 비활성화됨)

## 다음 단계

1. ✅ RDS 데이터베이스 생성 완료
2. ⏳ 스키마 생성 및 샘플 데이터 삽입
3. ⏳ 애플리케이션에서 데이터베이스 연결 테스트
4. ⏳ 프로덕션 데이터 마이그레이션 계획

## 참고 자료

- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [AWS RDS PostgreSQL 문서](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [ECS Exec 문서](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html)
