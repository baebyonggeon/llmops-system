# 🚀 ECS 자동 스케일링 구성 완전 가이드

## 개요

이 가이드는 AWS ECS 서비스에 자동 스케일링(Auto Scaling)을 구성하는 방법을 설명합니다. 자동 스케일링을 통해 트래픽 변화에 따라 자동으로 리소스를 조정하여 비용을 절감하고 성능을 최적화할 수 있습니다.

## 📊 자동 스케일링 개념

### 스케일링 정책 유형

| 정책 | 설명 | 사용 시기 |
|------|------|---------|
| **Target Tracking** | 목표 메트릭 값을 유지하도록 자동 조정 | 대부분의 경우 권장 |
| **Step Scaling** | 메트릭 값에 따라 단계별로 조정 | 복잡한 요구사항 |
| **Simple Scaling** | 단순 임계값 기반 조정 | 간단한 요구사항 |
| **Scheduled Scaling** | 예정된 시간에 용량 조정 | 정기적인 트래픽 패턴 |

### 스케일링 메트릭

| 메트릭 | 설명 | 권장 목표값 |
|--------|------|-----------|
| **CPU Utilization** | ECS 태스크의 평균 CPU 사용률 | 60-70% |
| **Memory Utilization** | ECS 태스크의 평균 메모리 사용률 | 70-80% |
| **ALB Request Count** | ALB의 초당 요청 수 | 1000-2000 req/s |
| **Custom Metric** | 사용자 정의 메트릭 | 비즈니스 요구사항 |

## 🔧 자동 스케일링 구성

### 1단계: 스케일링 대상 등록

#### AWS 콘솔에서 등록

```
1. AWS Console → Auto Scaling → Scalable targets
2. "Register scalable target" 클릭
3. 다음 정보 입력:
   - Service namespace: ECS
   - Resource ID: service/prod-llmops-cluster/prod-llmops-service
   - Scalable dimension: ecs:service:DesiredCount
   - Min capacity: 2
   - Max capacity: 10
4. "Register scalable target" 클릭
```

#### AWS CLI로 등록

```bash
# 변수 설정
CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
REGION="ap-northeast-2"

# 스케일링 대상 등록
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10 \
  --region $REGION

# 등록 확인
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --resource-ids service/$CLUSTER/$SERVICE \
  --region $REGION
```

**출력 예시:**
```json
{
  "ScalableTargets": [
    {
      "ServiceNamespace": "ecs",
      "ResourceId": "service/prod-llmops-cluster/prod-llmops-service",
      "ScalableDimension": "ecs:service:DesiredCount",
      "MinCapacity": 2,
      "MaxCapacity": 10,
      "RoleARN": "arn:aws:iam::083281668815:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
    }
  ]
}
```

### 2단계: Target Tracking 스케일링 정책 생성

#### CPU 기반 스케일링

```bash
# CPU 기반 스케일링 정책 생성
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

**파라미터 설명:**
- `TargetValue`: 유지할 목표 CPU 사용률 (%)
- `ScaleOutCooldown`: 스케일 아웃 후 대기 시간 (초)
- `ScaleInCooldown`: 스케일 인 후 대기 시간 (초)

#### 메모리 기반 스케일링

```bash
# 메모리 기반 스케일링 정책 생성
aws application-autoscaling put-scaling-policy \
  --policy-name memory-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 80.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

#### ALB 요청 수 기반 스케일링

```bash
# ALB 요청 수 기반 스케일링 정책 생성
aws application-autoscaling put-scaling-policy \
  --policy-name alb-request-count-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 1000.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

#### 커스텀 메트릭 기반 스케일링

```bash
# 커스텀 메트릭 기반 스케일링 정책 생성
aws application-autoscaling put-scaling-policy \
  --policy-name custom-metric-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 50.0,
    "CustomizedMetricSpecification": {
      "MetricName": "DatabaseConnections",
      "Namespace": "AWS/RDS",
      "Statistic": "Average",
      "Unit": "Count",
      "Dimensions": [
        {
          "Name": "DBInstanceIdentifier",
          "Value": "prod-llmops-postgres"
        }
      ]
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

### 3단계: Step Scaling 정책 생성 (고급)

#### Step Scaling 정책 생성

```bash
# CloudWatch 알람 생성 (CPU > 80%)
aws cloudwatch put-metric-alarm \
  --alarm-name ecs-cpu-high-for-scaling \
  --alarm-description "Trigger scale out when CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=$SERVICE \
               Name=ClusterName,Value=$CLUSTER \
  --region $REGION

# CloudWatch 알람 생성 (CPU < 30%)
aws cloudwatch put-metric-alarm \
  --alarm-name ecs-cpu-low-for-scaling \
  --alarm-description "Trigger scale in when CPU is low" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 30 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=$SERVICE \
               Name=ClusterName,Value=$CLUSTER \
  --region $REGION

# Step Scaling 정책 생성 (스케일 아웃)
aws application-autoscaling put-scaling-policy \
  --policy-name step-scaling-out \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "ChangeInCapacity",
    "StepAdjustments": [
      {
        "MetricIntervalLowerBound": 0,
        "MetricIntervalUpperBound": 10,
        "ScalingAdjustment": 1
      },
      {
        "MetricIntervalLowerBound": 10,
        "ScalingAdjustment": 2
      }
    ],
    "Cooldown": 300
  }' \
  --region $REGION

# Step Scaling 정책 생성 (스케일 인)
aws application-autoscaling put-scaling-policy \
  --policy-name step-scaling-in \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type StepScaling \
  --step-scaling-policy-configuration '{
    "AdjustmentType": "ChangeInCapacity",
    "StepAdjustments": [
      {
        "MetricIntervalUpperBound": 0,
        "ScalingAdjustment": -1
      }
    ],
    "Cooldown": 300
  }' \
  --region $REGION
```

### 4단계: 예약된 스케일링 (Scheduled Scaling)

#### 업무 시간 스케일링

```bash
# 평일 오전 9시에 최대 용량 증가
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --schedule "cron(0 9 ? * MON-FRI *)" \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --scheduled-action-name scale-up-business-hours \
  --scalable-target-action MinCapacity=4,MaxCapacity=20 \
  --region $REGION

# 평일 오후 6시에 최소 용량으로 축소
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --schedule "cron(0 18 ? * MON-FRI *)" \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --scheduled-action-name scale-down-after-hours \
  --scalable-target-action MinCapacity=2,MaxCapacity=5 \
  --region $REGION

# 주말에 최소 용량으로 축소
aws application-autoscaling put-scheduled-action \
  --service-namespace ecs \
  --schedule "cron(0 0 ? * SAT *)" \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --scheduled-action-name scale-down-weekend \
  --scalable-target-action MinCapacity=1,MaxCapacity=3 \
  --region $REGION
```

## 📋 스케일링 정책 관리

### 정책 조회

```bash
# 모든 스케일링 정책 조회
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --region $REGION

# 특정 서비스의 정책 조회
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION

# 정책 상세 정보 조회
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --policy-names cpu-scaling-policy \
  --region $REGION
```

### 정책 업데이트

```bash
# 목표값 변경
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 75.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

### 정책 삭제

```bash
# 스케일링 정책 삭제
aws application-autoscaling delete-scaling-policy \
  --policy-name cpu-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --region $REGION

# 스케일링 대상 등록 해제
aws application-autoscaling deregister-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --region $REGION
```

## 🔍 스케일링 활동 모니터링

### 스케일링 활동 조회

```bash
# 스케일링 활동 기록 조회
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION

# 최근 10개 활동 조회
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION \
  --query 'ScalingActivities[:10]' \
  --output table
```

**출력 예시:**
```
|  ActivityId                                    | Description                                          | Cause                                                     | StartTime             | EndTime               | StatusCode   |
|────────────────────────────────────────────────┼──────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┼───────────────────────┼───────────────────────┼──────────────|
|  a1b2c3d4-e5f6-7890-abcd-ef1234567890         | Scaling from 2 to 3 instances                        | CPU utilization exceeded 70%                              | 2025-01-06 10:15:00   | 2025-01-06 10:15:30   | Successful   |
|  b2c3d4e5-f6a7-8901-bcde-f12345678901         | Scaling from 3 to 4 instances                        | CPU utilization exceeded 70%                              | 2025-01-06 10:20:00   | 2025-01-06 10:20:30   | Successful   |
|  c3d4e5f6-a7b8-9012-cdef-123456789012         | Scaling from 4 to 3 instances                        | CPU utilization dropped below 30%                         | 2025-01-06 11:00:00   | 2025-01-06 11:00:30   | Successful   |
```

### CloudWatch 메트릭 모니터링

```bash
# 현재 원하는 태스크 수
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name DesiredTaskCount \
  --dimensions Name=ServiceName,Value=$SERVICE \
               Name=ClusterName,Value=$CLUSTER \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region $REGION

# 실행 중인 태스크 수
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name RunningTaskCount \
  --dimensions Name=ServiceName,Value=$SERVICE \
               Name=ClusterName,Value=$CLUSTER \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region $REGION
```

## 🎯 스케일링 정책 추천

### 개발 환경

```bash
# 최소 1개, 최대 3개 태스크
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 3 \
  --region $REGION

# CPU 기반 스케일링 (목표: 80%)
aws application-autoscaling put-scaling-policy \
  --policy-name dev-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 80.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 120,
    "ScaleInCooldown": 600
  }' \
  --region $REGION
```

### 스테이징 환경

```bash
# 최소 2개, 최대 5개 태스크
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 5 \
  --region $REGION

# CPU 기반 스케일링 (목표: 70%)
aws application-autoscaling put-scaling-policy \
  --policy-name staging-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

### 프로덕션 환경

```bash
# 최소 3개, 최대 20개 태스크
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 20 \
  --region $REGION

# CPU 기반 스케일링 (목표: 60%)
aws application-autoscaling put-scaling-policy \
  --policy-name prod-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 60.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION

# 메모리 기반 스케일링 (목표: 70%)
aws application-autoscaling put-scaling-policy \
  --policy-name prod-memory-scaling \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION

# ALB 요청 수 기반 스케일링 (목표: 1000 req/task)
aws application-autoscaling put-scaling-policy \
  --policy-name prod-alb-scaling \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 1000.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION
```

## 🔧 자동 스케일링 자동화 스크립트

```bash
#!/bin/bash
# setup-autoscaling.sh

set -e

CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
REGION="ap-northeast-2"

echo "자동 스케일링을 설정합니다..."

# 스케일링 대상 등록
echo "1. 스케일링 대상 등록..."
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10 \
  --region $REGION

# CPU 기반 스케일링 정책
echo "2. CPU 기반 스케일링 정책 생성..."
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION

# 메모리 기반 스케일링 정책
echo "3. 메모리 기반 스케일링 정책 생성..."
aws application-autoscaling put-scaling-policy \
  --policy-name memory-scaling-policy \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 80.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region $REGION

echo "✅ 자동 스케일링 설정 완료!"
echo ""
echo "설정 확인:"
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION \
  --query 'ScalingPolicies[].[PolicyName,PolicyType,TargetTrackingScalingPolicyConfiguration.TargetValue]' \
  --output table
```

## 📊 스케일링 성능 분석

### 스케일링 이벤트 분석

```bash
# 지난 24시간의 스케일링 활동 조회
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION \
  --query 'ScalingActivities[?StartTime>=`'$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)'`]' \
  --output table

# 스케일링 활동 통계
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/$CLUSTER/$SERVICE \
  --region $REGION \
  --query 'ScalingActivities[].[StatusCode]' \
  --output text | sort | uniq -c
```

### 비용 절감 분석

```bash
# 스케일링 전후 비용 비교
# 1. 고정 용량 (10개 태스크)
FIXED_COST=$(echo "10 * 24 * 30 * 0.032" | bc)  # t3.medium 가격

# 2. 자동 스케일링 (평균 5개 태스크)
AUTO_COST=$(echo "5 * 24 * 30 * 0.032" | bc)

# 3. 절감액
SAVINGS=$(echo "$FIXED_COST - $AUTO_COST" | bc)

echo "고정 용량 월 비용: \$$FIXED_COST"
echo "자동 스케일링 월 비용: \$$AUTO_COST"
echo "월간 절감액: \$$SAVINGS"
```

## ⚠️ 주의사항

### 스케일링 실패 원인

| 원인 | 해결 방법 |
|------|---------|
| **IAM 권한 부족** | IAM 역할에 `application-autoscaling:*` 권한 추가 |
| **태스크 정의 오류** | 태스크 정의 검증 및 수정 |
| **리소스 부족** | EC2 인스턴스 추가 또는 Fargate 용량 확인 |
| **헬스 체크 실패** | ALB 헬스 체크 설정 검증 |
| **메트릭 데이터 부족** | CloudWatch 메트릭 확인 및 대기 |

### 스케일링 최적화 팁

1. **Cooldown 시간 설정**: 스케일 아웃 후 60초, 스케일 인 후 300초 권장
2. **목표값 조정**: 초기 목표값 70%에서 시작하여 모니터링 후 조정
3. **다중 메트릭**: CPU와 메모리 모두 모니터링하여 안정성 향상
4. **예약된 스케일링**: 정기적인 트래픽 패턴에 대해 사용
5. **테스트**: 프로덕션 배포 전에 스테이징에서 테스트

## 📋 자동 스케일링 체크리스트

- [ ] 스케일링 대상 등록 (최소/최대 용량 설정)
- [ ] CPU 기반 스케일링 정책 생성
- [ ] 메모리 기반 스케일링 정책 생성 (선택사항)
- [ ] ALB 요청 수 기반 스케일링 정책 생성 (선택사항)
- [ ] CloudWatch 알람 설정
- [ ] 스케일링 활동 모니터링
- [ ] 성능 메트릭 분석
- [ ] 비용 절감 확인

## 🔗 유용한 링크

- [AWS Auto Scaling 문서](https://docs.aws.amazon.com/autoscaling/)
- [ECS Auto Scaling 가이드](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html)
- [CloudWatch 메트릭](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/EventTypes.html)

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-01-06
**다음 업데이트**: 자동 스케일링 구성 완료 후
