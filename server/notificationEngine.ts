import { TrainingMetric } from "./trainingMetrics";
import { getDb } from "./db";
import { notifications, alertConditions } from "../drizzle/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

export interface AlertRule {
  conditionType: "loss_threshold" | "accuracy_target" | "training_completed" | "training_failed";
  threshold?: number;
  operator?: "less_than" | "greater_than" | "equal" | "less_equal" | "greater_equal";
  userId: number;
  trainingId?: number;
}

export interface NotificationPayload {
  userId: number;
  trainingId?: number;
  notificationType:
    | "training_completed"
    | "loss_threshold"
    | "accuracy_target"
    | "training_failed"
    | "training_started"
    | "custom";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
}

// 조건 평가 함수
export function evaluateCondition(metric: TrainingMetric, rule: AlertRule): boolean {
  if (!rule.threshold || !rule.operator) return false;

  const value = rule.conditionType === "loss_threshold" ? metric.loss : metric.accuracy;

  switch (rule.operator) {
    case "less_than":
      return value < rule.threshold;
    case "greater_than":
      return value > rule.threshold;
    case "equal":
      return Math.abs(value - rule.threshold) < 0.0001;
    case "less_equal":
      return value <= rule.threshold;
    case "greater_equal":
      return value >= rule.threshold;
    default:
      return false;
  }
}

// 알림 저장
export async function saveNotification(payload: NotificationPayload): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification Engine] Database not available");
    return;
  }

  try {
    await db.insert(notifications).values({
      notificationId: `notif_${nanoid()}`,
      userId: payload.userId,
      trainingId: payload.trainingId,
      notificationType: payload.notificationType,
      title: payload.title,
      message: payload.message,
      severity: payload.severity,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
    });

    console.log(
      `[Notification Engine] Notification saved for user ${payload.userId}: ${payload.title}`
    );
  } catch (error) {
    console.error("[Notification Engine] Failed to save notification:", error);
  }
}

// 사용자의 활성 알림 조건 조회
export async function getActiveAlertConditions(
  userId: number,
  trainingId?: number
): Promise<AlertRule[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification Engine] Database not available");
    return [];
  }

  try {
    const conditions = await db
      .select()
      .from(alertConditions)
      .where(
        and(
          eq(alertConditions.userId, userId),
          eq(alertConditions.isActive, true),
          trainingId ? eq(alertConditions.trainingId, trainingId) : undefined
        )
      );

    return conditions.map((c) => ({
      conditionType: c.conditionType as any,
      threshold: c.threshold ? Number(c.threshold) : undefined,
      operator: c.operator as any,
      userId: c.userId,
      trainingId: c.trainingId || undefined,
    }));
  } catch (error) {
    console.error("[Notification Engine] Failed to get alert conditions:", error);
    return [];
  }
}

// 메트릭 기반 알림 처리
export async function processMetricAlerts(
  metric: TrainingMetric,
  userId: number
): Promise<void> {
  // 활성 알림 조건 조회
  const conditions = await getActiveAlertConditions(userId, metric.trainingId);

  for (const condition of conditions) {
    if (evaluateCondition(metric, condition)) {
      let title = "";
      let message = "";
      let severity: "info" | "warning" | "error" | "success" = "info";

      if (condition.conditionType === "loss_threshold") {
        title = "Loss 임계값 도달";
        message = `Training ${metric.trainingId}의 Loss가 ${condition.threshold}에 도달했습니다. (현재: ${metric.loss.toFixed(4)})`;
        severity = "success";
      } else if (condition.conditionType === "accuracy_target") {
        title = "정확도 목표 달성";
        message = `Training ${metric.trainingId}의 정확도가 ${condition.threshold}%에 도달했습니다. (현재: ${metric.accuracy.toFixed(2)}%)`;
        severity = "success";
      }

      if (title) {
        await saveNotification({
          userId,
          trainingId: metric.trainingId,
          notificationType:
            condition.conditionType === "loss_threshold" ? "loss_threshold" : "accuracy_target",
          title,
          message,
          severity,
          metadata: {
            metricType: condition.conditionType,
            threshold: condition.threshold,
            currentValue:
              condition.conditionType === "loss_threshold" ? metric.loss : metric.accuracy,
            epoch: metric.epoch,
          },
        });
      }
    }
  }
}

// 학습 완료 알림
export async function notifyTrainingCompleted(
  trainingId: number,
  userId: number,
  finalMetric: TrainingMetric
): Promise<void> {
  await saveNotification({
    userId,
    trainingId,
    notificationType: "training_completed",
    title: "학습 완료",
    message: `Training ${trainingId}이(가) 완료되었습니다. 최종 Loss: ${finalMetric.loss.toFixed(4)}, 정확도: ${finalMetric.accuracy.toFixed(2)}%`,
    severity: "success",
    metadata: {
      finalLoss: finalMetric.loss,
      finalAccuracy: finalMetric.accuracy,
      finalEpoch: finalMetric.epoch,
    },
  });
}

// 학습 실패 알림
export async function notifyTrainingFailed(
  trainingId: number,
  userId: number,
  reason: string
): Promise<void> {
  await saveNotification({
    userId,
    trainingId,
    notificationType: "training_failed",
    title: "학습 실패",
    message: `Training ${trainingId}이(가) 실패했습니다. 사유: ${reason}`,
    severity: "error",
    metadata: {
      failureReason: reason,
    },
  });
}

// 학습 시작 알림
export async function notifyTrainingStarted(
  trainingId: number,
  userId: number,
  trainingName: string
): Promise<void> {
  await saveNotification({
    userId,
    trainingId,
    notificationType: "training_started",
    title: "학습 시작",
    message: `Training "${trainingName}"이(가) 시작되었습니다.`,
    severity: "info",
    metadata: {
      trainingName,
    },
  });
}

// 사용자의 읽지 않은 알림 조회
export async function getUnreadNotifications(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification Engine] Database not available");
    return [];
  }

  try {
    const unreadNotifications = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy((t) => t.createdAt)
      .limit(limit);

    return unreadNotifications;
  } catch (error) {
    console.error("[Notification Engine] Failed to get unread notifications:", error);
    return [];
  }
}

// 알림 읽음 표시
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification Engine] Database not available");
    return;
  }

  try {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.notificationId, notificationId));
  } catch (error) {
    console.error("[Notification Engine] Failed to mark notification as read:", error);
  }
}

// 알림 조건 생성
export async function createAlertCondition(
  userId: number,
  trainingId: number | undefined,
  conditionType: "loss_threshold" | "accuracy_target" | "training_completed" | "training_failed",
  threshold?: number,
  operator?: "less_than" | "greater_than" | "equal" | "less_equal" | "greater_equal",
  description?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notification Engine] Database not available");
    return;
  }

  try {
    await db.insert(alertConditions).values({
      conditionId: `cond_${nanoid()}`,
      userId,
      trainingId,
      conditionType,
      threshold: threshold ? String(threshold) : null,
      operator,
      description,
      isActive: true,
    });

    console.log(
      `[Notification Engine] Alert condition created for user ${userId}: ${conditionType}`
    );
  } catch (error) {
    console.error("[Notification Engine] Failed to create alert condition:", error);
  }
}
