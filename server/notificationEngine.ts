import { getDb } from "./db";
import { nanoid } from "nanoid";

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
    | "system_alert";
  title: string;
  message: string;
  severity: "info" | "warning" | "error" | "success";
  metadata?: Record<string, any>;
}

export class NotificationEngine {
  private alertRules: Map<string, AlertRule> = new Map();

  /**
   * Register an alert rule for a user
   */
  registerAlertRule(rule: AlertRule): string {
    const ruleId = nanoid();
    this.alertRules.set(ruleId, rule);
    return ruleId;
  }

  /**
   * Evaluate metrics against alert rules
   */
  evaluateMetrics(
    userId: number,
    trainingId: number,
    metrics: {
      loss?: number;
      accuracy?: number;
      status?: string;
    }
  ): AlertRule[] {
    const triggeredRules: AlertRule[] = [];

    this.alertRules.forEach((rule) => {
      if (rule.userId !== userId || (rule.trainingId && rule.trainingId !== trainingId)) {
        return;
      }

      let triggered = false;

      switch (rule.conditionType) {
        case "loss_threshold":
          if (metrics.loss !== undefined && rule.threshold !== undefined) {
            triggered = this.evaluateCondition(metrics.loss, rule.threshold, rule.operator);
          }
          break;

        case "accuracy_target":
          if (metrics.accuracy !== undefined && rule.threshold !== undefined) {
            triggered = this.evaluateCondition(metrics.accuracy, rule.threshold, rule.operator);
          }
          break;

        case "training_completed":
          triggered = metrics.status === "completed";
          break;

        case "training_failed":
          triggered = metrics.status === "failed";
          break;
      }

      if (triggered) {
        triggeredRules.push(rule);
      }
    });

    return triggeredRules;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    value: number,
    threshold: number,
    operator?: string
  ): boolean {
    switch (operator) {
      case "less_than":
        return value < threshold;
      case "greater_than":
        return value > threshold;
      case "equal":
        return value === threshold;
      case "less_equal":
        return value <= threshold;
      case "greater_equal":
        return value >= threshold;
      default:
        return value < threshold;
    }
  }

  /**
   * Create and send a notification
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[NotificationEngine] Database not available");
        return;
      }

      // In a real implementation, you would insert into a notifications table
      // For now, we'll just log it
      console.log("[NotificationEngine] Notification sent:", {
        userId: payload.userId,
        type: payload.notificationType,
        title: payload.title,
        severity: payload.severity,
        timestamp: new Date().toISOString(),
      });

      // Emit WebSocket event if available
      // This would be handled by the trainingMetrics module
    } catch (error) {
      console.error("[NotificationEngine] Failed to send notification:", error);
    }
  }

  /**
   * Create notification for training completion
   */
  async notifyTrainingCompleted(
    userId: number,
    trainingId: number,
    metrics: { loss: number; accuracy: number; duration: number }
  ): Promise<void> {
    await this.sendNotification({
      userId,
      trainingId,
      notificationType: "training_completed",
      title: "Training Completed",
      message: `Training completed with Loss: ${metrics.loss.toFixed(4)}, Accuracy: ${metrics.accuracy.toFixed(2)}%`,
      severity: "success",
      metadata: metrics,
    });
  }

  /**
   * Create notification for loss threshold reached
   */
  async notifyLossThresholdReached(
    userId: number,
    trainingId: number,
    currentLoss: number,
    threshold: number
  ): Promise<void> {
    await this.sendNotification({
      userId,
      trainingId,
      notificationType: "loss_threshold",
      title: "Loss Threshold Reached",
      message: `Training loss has reached ${currentLoss.toFixed(4)} (threshold: ${threshold.toFixed(4)})`,
      severity: "info",
      metadata: { currentLoss, threshold },
    });
  }

  /**
   * Create notification for accuracy target reached
   */
  async notifyAccuracyTargetReached(
    userId: number,
    trainingId: number,
    currentAccuracy: number,
    target: number
  ): Promise<void> {
    await this.sendNotification({
      userId,
      trainingId,
      notificationType: "accuracy_target",
      title: "Accuracy Target Reached",
      message: `Training accuracy has reached ${currentAccuracy.toFixed(2)}% (target: ${target.toFixed(2)}%)`,
      severity: "success",
      metadata: { currentAccuracy, target },
    });
  }

  /**
   * Create notification for training failure
   */
  async notifyTrainingFailed(
    userId: number,
    trainingId: number,
    error: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      trainingId,
      notificationType: "training_failed",
      title: "Training Failed",
      message: `Training failed: ${error}`,
      severity: "error",
      metadata: { error },
    });
  }
}

// Export singleton instance
export const notificationEngine = new NotificationEngine();
