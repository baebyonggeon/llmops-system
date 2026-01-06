#!/bin/bash

################################################################################
# LLMOps 성능 모니터링 자동화 스크립트
#
# 이 스크립트는 CloudWatch 메트릭을 수집하고 성능을 분석합니다.
#
# 사용법:
#   ./scripts/performance-monitor.sh
#   ./scripts/performance-monitor.sh --interval 5 --duration 60
#   ./scripts/performance-monitor.sh --export csv
#
# 요구사항:
#   - AWS CLI 설치 및 구성
#   - jq (JSON 처리)
################################################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 기본값
INTERVAL=60  # 초 단위
DURATION=3600  # 초 단위 (기본 1시간)
EXPORT_FORMAT=""  # csv, json, table
REGION="ap-northeast-2"

# 함수: 로그 출력
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_metric() {
    echo -e "${CYAN}📊 $1${NC}"
}

# 함수: 도움말 출력
show_help() {
    cat << EOF
사용법: $0 [옵션]

옵션:
  -i, --interval SECONDS         모니터링 간격 (기본값: 60초)
  -d, --duration SECONDS         모니터링 지속 시간 (기본값: 3600초)
  -e, --export FORMAT            내보내기 형식 (csv, json, table)
  -r, --region REGION            AWS 리전 (기본값: ap-northeast-2)
  -h, --help                      이 도움말 표시

예시:
  # 기본값으로 실행 (1시간 모니터링)
  $0

  # 5초 간격으로 10분 모니터링
  $0 -i 5 -d 600

  # CSV 형식으로 내보내기
  $0 -e csv

  # JSON 형식으로 내보내기
  $0 -e json
EOF
}

# 함수: 인자 파싱
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--interval)
                INTERVAL="$2"
                shift 2
                ;;
            -d|--duration)
                DURATION="$2"
                shift 2
                ;;
            -e|--export)
                EXPORT_FORMAT="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 함수: 사전 조건 확인
check_prerequisites() {
    log "사전 조건을 확인합니다..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되어 있지 않습니다."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq가 설치되어 있지 않습니다. 설치하시겠습니까? (y/n)"
        read -r response
        if [[ "$response" == "y" ]]; then
            sudo apt-get install -y jq
        else
            log_warning "jq 없이 계속 진행합니다."
        fi
    fi
    
    log_success "사전 조건 확인 완료"
}

# 함수: ECS 메트릭 수집
get_ecs_metrics() {
    local metric=$1
    local start_time=$(date -u -d "$DURATION seconds ago" +%Y-%m-%dT%H:%M:%S)
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    aws cloudwatch get-metric-statistics \
        --namespace AWS/ECS \
        --metric-name "$metric" \
        --dimensions Name=ServiceName,Value=prod-llmops-service \
                     Name=ClusterName,Value=prod-llmops-cluster \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 300 \
        --statistics Average,Maximum,Minimum \
        --region "$REGION" \
        2>/dev/null || echo "[]"
}

# 함수: RDS 메트릭 수집
get_rds_metrics() {
    local metric=$1
    local start_time=$(date -u -d "$DURATION seconds ago" +%Y-%m-%dT%H:%M:%S)
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    aws cloudwatch get-metric-statistics \
        --namespace AWS/RDS \
        --metric-name "$metric" \
        --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 300 \
        --statistics Average,Maximum,Minimum \
        --region "$REGION" \
        2>/dev/null || echo "[]"
}

# 함수: ALB 메트릭 수집
get_alb_metrics() {
    local metric=$1
    local start_time=$(date -u -d "$DURATION seconds ago" +%Y-%m-%dT%H:%M:%S)
    local end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    aws cloudwatch get-metric-statistics \
        --namespace AWS/ApplicationELB \
        --metric-name "$metric" \
        --dimensions Name=LoadBalancer,Value=app/prod-llmops-alb/abc123 \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period 300 \
        --statistics Average,Maximum,Sum \
        --region "$REGION" \
        2>/dev/null || echo "[]"
}

# 함수: 메트릭 분석
analyze_metrics() {
    log_metric "ECS CPU 사용률"
    local ecs_cpu=$(get_ecs_metrics "CPUUtilization")
    if [ "$(echo "$ecs_cpu" | jq '.Datapoints | length')" -gt 0 ]; then
        local avg=$(echo "$ecs_cpu" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        local max=$(echo "$ecs_cpu" | jq '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        echo "  평균: ${avg}% | 최대: ${max}%"
    else
        echo "  데이터 없음"
    fi
    
    log_metric "ECS 메모리 사용률"
    local ecs_mem=$(get_ecs_metrics "MemoryUtilization")
    if [ "$(echo "$ecs_mem" | jq '.Datapoints | length')" -gt 0 ]; then
        local avg=$(echo "$ecs_mem" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        local max=$(echo "$ecs_mem" | jq '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        echo "  평균: ${avg}% | 최대: ${max}%"
    else
        echo "  데이터 없음"
    fi
    
    log_metric "RDS CPU 사용률"
    local rds_cpu=$(get_rds_metrics "CPUUtilization")
    if [ "$(echo "$rds_cpu" | jq '.Datapoints | length')" -gt 0 ]; then
        local avg=$(echo "$rds_cpu" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        local max=$(echo "$rds_cpu" | jq '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        echo "  평균: ${avg}% | 최대: ${max}%"
    else
        echo "  데이터 없음"
    fi
    
    log_metric "RDS 데이터베이스 연결"
    local rds_conn=$(get_rds_metrics "DatabaseConnections")
    if [ "$(echo "$rds_conn" | jq '.Datapoints | length')" -gt 0 ]; then
        local avg=$(echo "$rds_conn" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        local max=$(echo "$rds_conn" | jq '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        echo "  평균: ${avg} | 최대: ${max}"
    else
        echo "  데이터 없음"
    fi
    
    log_metric "ALB 응답 시간"
    local alb_response=$(get_alb_metrics "TargetResponseTime")
    if [ "$(echo "$alb_response" | jq '.Datapoints | length')" -gt 0 ]; then
        local avg=$(echo "$alb_response" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "N/A")
        local max=$(echo "$alb_response" | jq '.Datapoints | map(.Maximum) | max' 2>/dev/null || echo "N/A")
        echo "  평균: ${avg}초 | 최대: ${max}초"
    else
        echo "  데이터 없음"
    fi
    
    log_metric "ALB 요청 수"
    local alb_requests=$(get_alb_metrics "RequestCount")
    if [ "$(echo "$alb_requests" | jq '.Datapoints | length')" -gt 0 ]; then
        local total=$(echo "$alb_requests" | jq '.Datapoints | map(.Sum) | add' 2>/dev/null || echo "N/A")
        echo "  총 요청: ${total}"
    else
        echo "  데이터 없음"
    fi
}

# 함수: 실시간 모니터링
monitor_realtime() {
    log "실시간 모니터링을 시작합니다..."
    log "모니터링 간격: ${INTERVAL}초 | 지속 시간: ${DURATION}초"
    echo ""
    
    local elapsed=0
    while [ $elapsed -lt $DURATION ]; do
        clear
        echo -e "${BLUE}════════════════════════════════════════${NC}"
        echo -e "${BLUE}LLMOps 성능 모니터링${NC}"
        echo -e "${BLUE}════════════════════════════════════════${NC}"
        echo -e "시간: $(date)"
        echo -e "경과 시간: ${elapsed}초 / ${DURATION}초"
        echo ""
        
        analyze_metrics
        
        echo ""
        echo -e "${YELLOW}${INTERVAL}초 후 새로고침... (Ctrl+C로 종료)${NC}"
        
        sleep "$INTERVAL"
        elapsed=$((elapsed + INTERVAL))
    done
    
    log_success "모니터링 완료"
}

# 함수: CSV 형식으로 내보내기
export_csv() {
    log "CSV 형식으로 내보냅니다..."
    
    local filename="llmops-metrics-$(date +%Y%m%d-%H%M%S).csv"
    
    {
        echo "Timestamp,Metric,Average,Maximum,Minimum"
        
        # ECS 메트릭
        get_ecs_metrics "CPUUtilization" | jq -r '.Datapoints[] | "\(.Timestamp),ECS CPU,\(.Average),\(.Maximum),\(.Minimum)"' >> "$filename"
        get_ecs_metrics "MemoryUtilization" | jq -r '.Datapoints[] | "\(.Timestamp),ECS Memory,\(.Average),\(.Maximum),\(.Minimum)"' >> "$filename"
        
        # RDS 메트릭
        get_rds_metrics "CPUUtilization" | jq -r '.Datapoints[] | "\(.Timestamp),RDS CPU,\(.Average),\(.Maximum),\(.Minimum)"' >> "$filename"
        get_rds_metrics "DatabaseConnections" | jq -r '.Datapoints[] | "\(.Timestamp),RDS Connections,\(.Average),\(.Maximum),\(.Minimum)"' >> "$filename"
    } > "$filename"
    
    log_success "CSV 파일 생성: $filename"
}

# 함수: JSON 형식으로 내보내기
export_json() {
    log "JSON 형식으로 내보냅니다..."
    
    local filename="llmops-metrics-$(date +%Y%m%d-%H%M%S).json"
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
        echo "  \"metrics\": {"
        echo "    \"ecs\": {"
        echo "      \"cpu\": $(get_ecs_metrics 'CPUUtilization'),"
        echo "      \"memory\": $(get_ecs_metrics 'MemoryUtilization')"
        echo "    },"
        echo "    \"rds\": {"
        echo "      \"cpu\": $(get_rds_metrics 'CPUUtilization'),"
        echo "      \"connections\": $(get_rds_metrics 'DatabaseConnections')"
        echo "    },"
        echo "    \"alb\": {"
        echo "      \"response_time\": $(get_alb_metrics 'TargetResponseTime'),"
        echo "      \"requests\": $(get_alb_metrics 'RequestCount')"
        echo "    }"
        echo "  }"
        echo "}"
    } > "$filename"
    
    log_success "JSON 파일 생성: $filename"
}

# 함수: 성능 평가
evaluate_performance() {
    log "성능을 평가합니다..."
    echo ""
    
    local ecs_cpu=$(get_ecs_metrics "CPUUtilization" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "0")
    local ecs_mem=$(get_ecs_metrics "MemoryUtilization" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "0")
    local rds_cpu=$(get_rds_metrics "CPUUtilization" | jq '.Datapoints | map(.Average) | add / length' 2>/dev/null || echo "0")
    
    # ECS CPU 평가
    if (( $(echo "$ecs_cpu < 60" | bc -l) )); then
        log_success "ECS CPU: 양호 (${ecs_cpu}%)"
    elif (( $(echo "$ecs_cpu < 80" | bc -l) )); then
        log_warning "ECS CPU: 주의 (${ecs_cpu}%)"
    else
        log_error "ECS CPU: 위험 (${ecs_cpu}%)"
    fi
    
    # ECS 메모리 평가
    if (( $(echo "$ecs_mem < 70" | bc -l) )); then
        log_success "ECS 메모리: 양호 (${ecs_mem}%)"
    elif (( $(echo "$ecs_mem < 85" | bc -l) )); then
        log_warning "ECS 메모리: 주의 (${ecs_mem}%)"
    else
        log_error "ECS 메모리: 위험 (${ecs_mem}%)"
    fi
    
    # RDS CPU 평가
    if (( $(echo "$rds_cpu < 60" | bc -l) )); then
        log_success "RDS CPU: 양호 (${rds_cpu}%)"
    elif (( $(echo "$rds_cpu < 80" | bc -l) )); then
        log_warning "RDS CPU: 주의 (${rds_cpu}%)"
    else
        log_error "RDS CPU: 위험 (${rds_cpu}%)"
    fi
}

# 메인 함수
main() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}LLMOps 성능 모니터링 도구${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    
    parse_args "$@"
    check_prerequisites
    echo ""
    
    if [ -n "$EXPORT_FORMAT" ]; then
        case "$EXPORT_FORMAT" in
            csv)
                export_csv
                ;;
            json)
                export_json
                ;;
            *)
                log_error "알 수 없는 형식: $EXPORT_FORMAT"
                exit 1
                ;;
        esac
    else
        monitor_realtime
    fi
    
    echo ""
    evaluate_performance
    echo ""
}

# 스크립트 실행
main "$@"
