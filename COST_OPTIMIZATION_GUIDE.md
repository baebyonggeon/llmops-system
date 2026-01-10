# 💰 AWS 비용 절감 분석 및 최적화 완전 가이드

## 개요

이 가이드는 배포된 LLMOps 시스템의 AWS 비용을 분석하고 최적화하는 방법을 설명합니다. 자동 스케일링, 리소스 조정, 예약 인스턴스 활용 등을 통해 월간 비용을 30-50% 절감할 수 있습니다.

## 📊 현재 비용 구조 분석

### 주요 비용 항목

| 서비스 | 인스턴스 | 사용량 | 월간 비용 | 비율 |
|--------|---------|--------|----------|------|
| **ECS (Fargate)** | t3.medium | 10개 × 24h × 30d | $230 | 45% |
| **RDS (PostgreSQL)** | db.t3.micro | 24h × 30d | $30 | 6% |
| **ALB** | - | 1개 | $16 | 3% |
| **NAT Gateway** | - | 1개 + 데이터 | $32 | 6% |
| **Data Transfer** | - | ~100GB | $20 | 4% |
| **CloudWatch** | - | 로그, 메트릭 | $15 | 3% |
| **ECR** | - | 이미지 저장소 | $10 | 2% |
| **기타** | - | - | $147 | 31% |
| **합계** | - | - | **$500** | **100%** |

### 비용 계산 공식

```bash
# ECS Fargate 비용 계산
# vCPU 가격: $0.04048/시간, 메모리 가격: $0.004445/GB/시간

# t3.medium (1 vCPU, 4GB 메모리)
HOURLY_COST=$(echo "1 * 0.04048 + 4 * 0.004445" | bc)  # $0.06228/시간
MONTHLY_COST=$(echo "$HOURLY_COST * 24 * 30" | bc)     # $44.82/개월

# 10개 태스크 기준
TOTAL_COST=$(echo "$MONTHLY_COST * 10" | bc)           # $448.20/개월

# RDS db.t3.micro 비용
# 가격: $0.017/시간
RDS_MONTHLY=$(echo "0.017 * 24 * 30" | bc)             # $12.24/개월
```

## 🔍 비용 분석 도구

### 1단계: AWS Cost Explorer 사용

#### AWS 콘솔에서 비용 분석

```
1. AWS Console → Cost Management → Cost Explorer
2. "Launch Cost Explorer" 클릭
3. 시간 범위 선택 (지난 30일)
4. "Group by" → Service 선택
5. 각 서비스별 비용 확인
```

#### CLI로 비용 조회

```bash
# 지난 30일 비용 조회
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1 \
  --output table
```

**출력 예시:**
```
|  Service              | UnblendedCost |
|───────────────────────┼───────────────|
|  Amazon Elastic Compute Cloud | $250.00 |
|  Amazon Relational Database Service | $30.00 |
|  Elastic Load Balancing | $16.00 |
|  AWS Data Transfer | $20.00 |
|  Amazon CloudWatch | $15.00 |
|  Amazon EC2 Container Registry | $10.00 |
```

### 2단계: 서비스별 비용 분석

#### ECS 비용 상세 분석

```bash
# ECS 비용 조회 (Fargate)
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --filter file://ecs-filter.json \
  --group-by Type=DIMENSION,Key=PURCHASE_TYPE \
  --region us-east-1 \
  --output table

# ecs-filter.json
cat > ecs-filter.json << 'EOF'
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Elastic Container Service"]
  }
}
EOF
```

#### RDS 비용 상세 분석

```bash
# RDS 비용 조회
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --filter file://rds-filter.json \
  --group-by Type=DIMENSION,Key=DATABASE_ENGINE \
  --region us-east-1 \
  --output table

# rds-filter.json
cat > rds-filter.json << 'EOF'
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Relational Database Service"]
  }
}
EOF
```

#### Data Transfer 비용 분석

```bash
# 데이터 전송 비용 조회
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --filter file://data-transfer-filter.json \
  --region us-east-1 \
  --output table

# data-transfer-filter.json
cat > data-transfer-filter.json << 'EOF'
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["AWS Data Transfer"]
  }
}
EOF
```

## 💡 비용 절감 전략

### 1. 자동 스케일링 활용 (절감: 30-40%)

#### 현재 비용 (고정 용량)

```bash
# 10개 태스크 항상 실행
FIXED_CAPACITY=10
HOURLY_COST=0.06228
MONTHLY_COST=$(echo "$FIXED_CAPACITY * $HOURLY_COST * 24 * 30" | bc)
echo "고정 용량 월 비용: \$$MONTHLY_COST"  # $448.20
```

#### 자동 스케일링 적용 후 비용

```bash
# 평균 5개 태스크 (최소 2개, 최대 10개)
AUTO_CAPACITY=5
HOURLY_COST=0.06228
MONTHLY_COST=$(echo "$AUTO_CAPACITY * $HOURLY_COST * 24 * 30" | bc)
echo "자동 스케일링 월 비용: \$$MONTHLY_COST"  # $224.10

# 절감액
SAVINGS=$(echo "448.20 - 224.10" | bc)
SAVINGS_PERCENT=$(echo "scale=2; $SAVINGS / 448.20 * 100" | bc)
echo "월간 절감액: \$$SAVINGS ($SAVINGS_PERCENT%)"  # $224.10 (50%)
```

### 2. 예약 인스턴스 활용 (절감: 30-70%)

#### 1년 예약 인스턴스 구매

```bash
# Fargate 1년 예약 (선결제)
# 정가: $0.06228/시간
# 예약 가격: $0.04359/시간 (30% 할인)

RESERVED_HOURLY=0.04359
MONTHLY_COST=$(echo "5 * $RESERVED_HOURLY * 24 * 30" | bc)
echo "예약 인스턴스 월 비용: \$$MONTHLY_COST"  # $156.87

# 절감액
SAVINGS=$(echo "224.10 - 156.87" | bc)
SAVINGS_PERCENT=$(echo "scale=2; $SAVINGS / 224.10 * 100" | bc)
echo "월간 절감액: \$$SAVINGS ($SAVINGS_PERCENT%)"  # $67.23 (30%)
```

#### AWS 콘솔에서 예약 인스턴스 구매

```
1. AWS Console → EC2 → Reserved Instances
2. "Purchase Reserved Instances" 클릭
3. 다음 설정:
   - Platform: Fargate
   - vCPU: 1
   - Memory: 4GB
   - Term: 1 year
   - Payment Option: All Upfront
4. "Purchase" 클릭
```

### 3. RDS 최적화 (절감: 20-30%)

#### 인스턴스 크기 조정

```bash
# 현재: db.t3.micro ($0.017/시간)
CURRENT_COST=$(echo "0.017 * 24 * 30" | bc)
echo "현재 RDS 비용: \$$CURRENT_COST"  # $12.24

# 최적화: db.t3.micro 유지 (이미 최소 크기)
# 대신 자동 스토리지 확장 설정
aws rds modify-db-instance \
  --db-instance-identifier prod-llmops-postgres \
  --storage-autoscaling-enabled \
  --max-allocated-storage 100 \
  --apply-immediately \
  --region ap-northeast-2
```

#### RDS 예약 인스턴스

```bash
# 1년 예약 (db.t3.micro)
# 정가: $0.017/시간
# 예약 가격: $0.0119/시간 (30% 할인)

RESERVED_HOURLY=0.0119
MONTHLY_COST=$(echo "$RESERVED_HOURLY * 24 * 30" | bc)
echo "예약 RDS 월 비용: \$$MONTHLY_COST"  # $8.57

# 절감액
SAVINGS=$(echo "12.24 - 8.57" | bc)
echo "월간 절감액: \$$SAVINGS"  # $3.67
```

### 4. 데이터 전송 최적화 (절감: 10-20%)

#### NAT Gateway 비용 최적화

```bash
# 현재: NAT Gateway 1개 + 데이터 처리
# 월간 비용: $32 (고정 $0.045/시간 + 데이터 처리)

# 최적화 1: VPC 엔드포인트 사용 (S3, DynamoDB)
# 월간 비용: $7 (VPC 엔드포인트 1개)
# 절감액: $25/월

# 최적화 2: CloudFront 사용 (정적 콘텐츠)
# 월간 비용: $0.085/GB (첫 10TB)
# 절감액: 데이터 전송 비용 50% 감소
```

#### VPC 엔드포인트 생성

```bash
# S3 VPC 엔드포인트 생성
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345678 \
  --service-name com.amazonaws.ap-northeast-2.s3 \
  --route-table-ids rtb-12345678 \
  --region ap-northeast-2

# DynamoDB VPC 엔드포인트 생성
aws ec2 create-vpc-endpoint \
  --vpc-id vpc-12345678 \
  --service-name com.amazonaws.ap-northeast-2.dynamodb \
  --route-table-ids rtb-12345678 \
  --region ap-northeast-2
```

### 5. CloudWatch 비용 최적화 (절감: 5-10%)

#### 로그 보관 기간 조정

```bash
# 현재: 무제한 보관 ($0.50/GB/월)
# 최적화: 30일 보관

aws logs put-retention-policy \
  --log-group-name /ecs/prod-llmops-app \
  --retention-in-days 30 \
  --region ap-northeast-2

# 월간 절감액 (100GB 기준)
SAVINGS=$(echo "100 * 0.50 * 0.7" | bc)  # 30일 보관으로 70% 감소
echo "월간 절감액: \$$SAVINGS"  # $35
```

#### 메트릭 필터 최적화

```bash
# 불필요한 메트릭 비활성화
aws cloudwatch disable-alarm-actions \
  --alarm-names non-critical-alarms \
  --region ap-northeast-2

# 커스텀 메트릭 정리
aws cloudwatch list-metrics \
  --namespace Custom \
  --region ap-northeast-2 \
  --query 'Metrics[].[MetricName,Dimensions]' \
  --output table
```

## 📈 비용 절감 시뮬레이션

### 절감 전 (현재 상태)

```bash
#!/bin/bash

# 비용 계산
ECS_COST=$(echo "10 * 0.06228 * 24 * 30" | bc)
RDS_COST=$(echo "0.017 * 24 * 30" | bc)
ALB_COST=16
NAT_COST=32
DATA_TRANSFER=20
CLOUDWATCH=15
ECR=10
OTHER=147

TOTAL=$(echo "$ECS_COST + $RDS_COST + $ALB_COST + $NAT_COST + $DATA_TRANSFER + $CLOUDWATCH + $ECR + $OTHER" | bc)

echo "=== 절감 전 월간 비용 ==="
echo "ECS (Fargate):     \$$ECS_COST"
echo "RDS (PostgreSQL):  \$$RDS_COST"
echo "ALB:               \$$ALB_COST"
echo "NAT Gateway:       \$$NAT_COST"
echo "Data Transfer:     \$$DATA_TRANSFER"
echo "CloudWatch:        \$$CLOUDWATCH"
echo "ECR:               \$$ECR"
echo "기타:              \$$OTHER"
echo "─────────────────────────"
echo "합계:              \$$TOTAL"
```

**출력:**
```
=== 절감 전 월간 비용 ===
ECS (Fargate):     $448.20
RDS (PostgreSQL):  $12.24
ALB:               $16.00
NAT Gateway:       $32.00
Data Transfer:     $20.00
CloudWatch:        $15.00
ECR:               $10.00
기타:              $147.00
─────────────────────────
합계:              $700.44
```

### 절감 후 (최적화 적용)

```bash
#!/bin/bash

# 비용 계산 (최적화 적용)
ECS_COST=$(echo "5 * 0.04359 * 24 * 30" | bc)      # 자동 스케일링 + 예약 인스턴스
RDS_COST=$(echo "0.0119 * 24 * 30" | bc)           # 예약 인스턴스
ALB_COST=16
NAT_COST=7                                          # VPC 엔드포인트
DATA_TRANSFER=10                                    # CloudFront
CLOUDWATCH=8                                        # 로그 보관 기간 조정
ECR=10
OTHER=100                                           # 기타 최적화

TOTAL=$(echo "$ECS_COST + $RDS_COST + $ALB_COST + $NAT_COST + $DATA_TRANSFER + $CLOUDWATCH + $ECR + $OTHER" | bc)

echo "=== 절감 후 월간 비용 ==="
echo "ECS (Fargate):     \$$ECS_COST"
echo "RDS (PostgreSQL):  \$$RDS_COST"
echo "ALB:               \$$ALB_COST"
echo "NAT Gateway:       \$$NAT_COST"
echo "Data Transfer:     \$$DATA_TRANSFER"
echo "CloudWatch:        \$$CLOUDWATCH"
echo "ECR:               \$$ECR"
echo "기타:              \$$OTHER"
echo "─────────────────────────"
echo "합계:              \$$TOTAL"

# 절감액 계산
SAVINGS=$(echo "700.44 - $TOTAL" | bc)
SAVINGS_PERCENT=$(echo "scale=2; $SAVINGS / 700.44 * 100" | bc)

echo ""
echo "월간 절감액: \$$SAVINGS"
echo "절감율: $SAVINGS_PERCENT%"
echo "연간 절감액: \$$(echo "$SAVINGS * 12" | bc)"
```

**출력:**
```
=== 절감 후 월간 비용 ===
ECS (Fargate):     $156.87
RDS (PostgreSQL):  $8.57
ALB:               $16.00
NAT Gateway:       $7.00
Data Transfer:     $10.00
CloudWatch:        $8.00
ECR:               $10.00
기타:              $100.00
─────────────────────────
합계:              $316.44

월간 절감액: $384.00
절감율: 54.84%
연간 절감액: $4608.00
```

## 🔧 비용 최적화 자동화 스크립트

```bash
#!/bin/bash
# cost-optimization.sh

set -e

CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
REGION="ap-northeast-2"

echo "AWS 비용 최적화를 시작합니다..."

# 1. 로그 보관 기간 설정
echo "1. CloudWatch 로그 보관 기간 설정..."
aws logs put-retention-policy \
  --log-group-name /ecs/prod-llmops-app \
  --retention-in-days 30 \
  --region $REGION

# 2. RDS 자동 스토리지 확장 활성화
echo "2. RDS 자동 스토리지 확장 활성화..."
aws rds modify-db-instance \
  --db-instance-identifier prod-llmops-postgres \
  --storage-autoscaling-enabled \
  --max-allocated-storage 100 \
  --apply-immediately \
  --region $REGION

# 3. 불필요한 CloudWatch 알람 비활성화
echo "3. 불필요한 CloudWatch 알람 비활성화..."
aws cloudwatch disable-alarm-actions \
  --alarm-names non-critical-alarms \
  --region $REGION

# 4. 비용 분석 보고서 생성
echo "4. 비용 분석 보고서 생성..."
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1 \
  --output table

echo "✅ AWS 비용 최적화 완료!"
```

## 📋 비용 최적화 체크리스트

### 즉시 실행 (0-1주)
- [ ] AWS Cost Explorer에서 비용 분석
- [ ] 불필요한 리소스 삭제
- [ ] CloudWatch 로그 보관 기간 설정
- [ ] 미사용 탄성 IP 제거

### 단기 계획 (1-4주)
- [ ] 자동 스케일링 설정
- [ ] VPC 엔드포인트 생성
- [ ] CloudFront CDN 설정
- [ ] RDS 백업 정책 최적화

### 중기 계획 (1-3개월)
- [ ] 예약 인스턴스 구매 (1년)
- [ ] 스토리지 계층화 (S3 Glacier)
- [ ] 데이터베이스 읽기 복제본
- [ ] 비용 알람 설정

### 장기 계획 (3-12개월)
- [ ] 다중 리전 배포 검토
- [ ] 서버리스 아키텍처 전환
- [ ] 엔터프라이즈 할인 협상
- [ ] 비용 최적화 자동화

## 🎯 비용 목표

| 단계 | 월간 비용 | 절감액 | 절감율 | 목표 기간 |
|------|----------|--------|--------|---------|
| **현재** | $700 | - | - | - |
| **1단계** | $580 | $120 | 17% | 1주 |
| **2단계** | $420 | $160 | 23% | 1개월 |
| **3단계** | $316 | $104 | 25% | 3개월 |
| **최종** | $280 | $36 | 11% | 12개월 |

## 📞 비용 모니터링

### 월간 비용 리뷰

```bash
#!/bin/bash
# monthly-cost-review.sh

REGION="us-east-1"

echo "=== 월간 비용 리뷰 ==="
echo "기간: $(date -d 'last month' +%Y-%m-01) ~ $(date +%Y-%m-01)"
echo ""

# 서비스별 비용
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region $REGION \
  --output table

echo ""
echo "=== 비용 추이 ==="

# 지난 3개월 비용 추이
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '90 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --region $REGION \
  --output table
```

## 🔗 유용한 링크

- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
- [AWS 가격 계산기](https://calculator.aws/)
- [AWS 비용 최적화 모범 사례](https://aws.amazon.com/ko/blogs/cost-management/)
- [AWS 예약 인스턴스](https://aws.amazon.com/ko/ec2/pricing/reserved-instances/)

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-01-09
**다음 업데이트**: 비용 최적화 적용 후
