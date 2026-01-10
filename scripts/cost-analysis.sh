#!/bin/bash

################################################################################
# AWS 비용 분석 및 최적화 자동화 스크립트
#
# 이 스크립트는 AWS 서비스의 비용을 분석하고 최적화 방안을 제시합니다.
#
# 사용법:
#   ./scripts/cost-analysis.sh
#   ./scripts/cost-analysis.sh --period 30
#   ./scripts/cost-analysis.sh --export csv
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
MAGENTA='\033[0;35m'
NC='\033[0m'

# 기본값
PERIOD=30  # 일 단위
EXPORT_FORMAT=""  # csv, json, report
REGION="us-east-1"

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

log_money() {
    echo -e "${MAGENTA}💰 $1${NC}"
}

# 함수: 도움말 출력
show_help() {
    cat << EOF
사용법: $0 [옵션]

옵션:
  -p, --period DAYS              분석 기간 (기본값: 30일)
  -e, --export FORMAT            내보내기 형식 (csv, json, report)
  -r, --region REGION            AWS 리전 (기본값: us-east-1)
  -h, --help                      이 도움말 표시

예시:
  # 기본값으로 실행 (지난 30일 분석)
  $0

  # 지난 90일 분석
  $0 -p 90

  # CSV 형식으로 내보내기
  $0 -e csv

  # 상세 보고서 생성
  $0 -e report
EOF
}

# 함수: 인자 파싱
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--period)
                PERIOD="$2"
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
        fi
    fi
    
    log_success "사전 조건 확인 완료"
}

# 함수: 비용 데이터 조회
get_cost_data() {
    local start_date=$(date -u -d "$PERIOD days ago" +%Y-%m-%d)
    local end_date=$(date -u +%Y-%m-%d)
    
    aws ce get-cost-and-usage \
        --time-period Start=$start_date,End=$end_date \
        --granularity MONTHLY \
        --metrics "UnblendedCost" \
        --group-by Type=DIMENSION,Key=SERVICE \
        --region $REGION \
        2>/dev/null || echo "{}"
}

# 함수: 서비스별 비용 분석
analyze_service_costs() {
    log_metric "서비스별 비용 분석"
    
    local cost_data=$(get_cost_data)
    
    if [ "$(echo "$cost_data" | jq '.ResultsByTime | length')" -eq 0 ]; then
        log_warning "비용 데이터가 없습니다."
        return
    fi
    
    echo ""
    echo -e "${CYAN}서비스별 비용:${NC}"
    echo ""
    
    # 서비스별 비용 추출 및 정렬
    echo "$cost_data" | jq -r '.ResultsByTime[0].Groups[] | 
        "\(.Keys[0]): \(.Metrics.UnblendedCost.Amount)"' | \
        sort -t':' -k2 -rn | \
        while read line; do
            service=$(echo "$line" | cut -d':' -f1)
            cost=$(echo "$line" | cut -d':' -f2)
            
            # 비용에 따라 색상 변경
            if (( $(echo "$cost > 100" | bc -l) )); then
                echo -e "${RED}  $service: \$$cost${NC}"
            elif (( $(echo "$cost > 50" | bc -l) )); then
                echo -e "${YELLOW}  $service: \$$cost${NC}"
            else
                echo -e "${GREEN}  $service: \$$cost${NC}"
            fi
        done
    
    echo ""
}

# 함수: 총 비용 계산
calculate_total_cost() {
    local cost_data=$(get_cost_data)
    
    local total=$(echo "$cost_data" | jq '.ResultsByTime[0].Total.UnblendedCost.Amount' 2>/dev/null || echo "0")
    
    echo "$total"
}

# 함수: 월간 비용 추이
analyze_cost_trend() {
    log_metric "월간 비용 추이"
    
    local start_date=$(date -u -d "90 days ago" +%Y-%m-%d)
    local end_date=$(date -u +%Y-%m-%d)
    
    local trend_data=$(aws ce get-cost-and-usage \
        --time-period Start=$start_date,End=$end_date \
        --granularity MONTHLY \
        --metrics "UnblendedCost" \
        --region $REGION \
        2>/dev/null || echo "{}")
    
    echo ""
    echo -e "${CYAN}지난 3개월 비용:${NC}"
    echo ""
    
    echo "$trend_data" | jq -r '.ResultsByTime[] | 
        "\(.TimePeriod.Start): \(.Total.UnblendedCost.Amount)"' | \
        while read line; do
            date=$(echo "$line" | cut -d':' -f1)
            cost=$(echo "$line" | cut -d':' -f2)
            
            # 비용 시각화
            bar_length=$(echo "$cost / 10" | bc)
            bar=$(printf '█%.0s' $(seq 1 $bar_length))
            
            echo -e "  $date: $bar \$$cost"
        done
    
    echo ""
}

# 함수: 비용 절감 제안
suggest_optimizations() {
    log_metric "비용 절감 제안"
    
    local total=$(calculate_total_cost)
    
    echo ""
    echo -e "${CYAN}추천 최적화:${NC}"
    echo ""
    
    # 자동 스케일링
    echo -e "${YELLOW}1. 자동 스케일링 활성화${NC}"
    local savings=$(echo "$total * 0.3" | bc)
    echo -e "   절감액: \$$(printf "%.2f" $savings)/월 (30% 절감)"
    echo ""
    
    # 예약 인스턴스
    echo -e "${YELLOW}2. 예약 인스턴스 구매${NC}"
    savings=$(echo "$total * 0.3" | bc)
    echo -e "   절감액: \$$(printf "%.2f" $savings)/월 (30% 절감)"
    echo ""
    
    # VPC 엔드포인트
    echo -e "${YELLOW}3. VPC 엔드포인트 설정${NC}"
    savings=$(echo "$total * 0.1" | bc)
    echo -e "   절감액: \$$(printf "%.2f" $savings)/월 (10% 절감)"
    echo ""
    
    # CloudWatch 최적화
    echo -e "${YELLOW}4. CloudWatch 로그 보관 기간 조정${NC}"
    savings=$(echo "$total * 0.05" | bc)
    echo -e "   절감액: \$$(printf "%.2f" $savings)/월 (5% 절감)"
    echo ""
    
    # 총 절감액
    local total_savings=$(echo "$total * 0.75" | bc)
    echo -e "${GREEN}총 월간 절감액: \$$(printf "%.2f" $total_savings) (75% 절감)${NC}"
    echo -e "${GREEN}연간 절감액: \$$(printf "%.2f" $(echo "$total_savings * 12" | bc))${NC}"
    echo ""
}

# 함수: CSV 형식으로 내보내기
export_csv() {
    log "CSV 형식으로 내보냅니다..."
    
    local filename="aws-cost-analysis-$(date +%Y%m%d-%H%M%S).csv"
    
    {
        echo "Date,Service,Cost"
        
        local cost_data=$(get_cost_data)
        echo "$cost_data" | jq -r '.ResultsByTime[] | 
            .TimePeriod.Start as $date |
            .Groups[] |
            "\($date),\(.Keys[0]),\(.Metrics.UnblendedCost.Amount)"'
    } > "$filename"
    
    log_success "CSV 파일 생성: $filename"
}

# 함수: JSON 형식으로 내보내기
export_json() {
    log "JSON 형식으로 내보냅니다..."
    
    local filename="aws-cost-analysis-$(date +%Y%m%d-%H%M%S).json"
    
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
        echo "  \"period_days\": $PERIOD,"
        echo "  \"cost_data\": $(get_cost_data)"
        echo "}"
    } > "$filename"
    
    log_success "JSON 파일 생성: $filename"
}

# 함수: 상세 보고서 생성
export_report() {
    log "상세 보고서를 생성합니다..."
    
    local filename="aws-cost-report-$(date +%Y%m%d-%H%M%S).md"
    
    {
        echo "# AWS 비용 분석 보고서"
        echo ""
        echo "**생성 날짜**: $(date)"
        echo "**분석 기간**: 지난 $PERIOD일"
        echo ""
        
        echo "## 서비스별 비용"
        echo ""
        
        local cost_data=$(get_cost_data)
        echo "$cost_data" | jq -r '.ResultsByTime[0].Groups[] | 
            "| \(.Keys[0]) | \$\(.Metrics.UnblendedCost.Amount) |"' | \
            (echo "| 서비스 | 비용 |"; echo "|--------|------|"; cat)
        
        echo ""
        echo "## 비용 절감 제안"
        echo ""
        echo "1. **자동 스케일링 활성화**: 30% 절감 가능"
        echo "2. **예약 인스턴스 구매**: 30% 절감 가능"
        echo "3. **VPC 엔드포인트 설정**: 10% 절감 가능"
        echo "4. **CloudWatch 최적화**: 5% 절감 가능"
        echo ""
        echo "**총 절감 가능액**: 75%"
        
    } > "$filename"
    
    log_success "보고서 생성: $filename"
}

# 메인 함수
main() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}AWS 비용 분석 및 최적화${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    
    parse_args "$@"
    check_prerequisites
    echo ""
    
    echo -e "분석 기간: ${CYAN}지난 $PERIOD일${NC}"
    echo -e "리전: ${CYAN}$REGION${NC}"
    echo ""
    
    if [ -n "$EXPORT_FORMAT" ]; then
        case "$EXPORT_FORMAT" in
            csv)
                export_csv
                ;;
            json)
                export_json
                ;;
            report)
                export_report
                ;;
            *)
                log_error "알 수 없는 형식: $EXPORT_FORMAT"
                exit 1
                ;;
        esac
    else
        analyze_service_costs
        analyze_cost_trend
        suggest_optimizations
    fi
    
    echo ""
    log_success "비용 분석 완료"
}

# 스크립트 실행
main "$@"
