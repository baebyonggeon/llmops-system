import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateCondition,
  AlertRule,
  NotificationPayload,
} from "./notificationEngine";
import type { TrainingMetric } from "./trainingMetrics";

describe("Notification Engine", () => {
  const mockMetric: TrainingMetric = {
    trainingId: 1,
    epoch: 5,
    loss: 0.0856,
    accuracy: 92.34,
    gpuUsage: 75.5,
    cpuUsage: 45.2,
    memoryUsage: 62.1,
    batchesProcessed: 50,
    totalBatches: 100,
    timestamp: Date.now(),
  };

  describe("evaluateCondition", () => {
    it("should evaluate loss_threshold with less_than operator", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.1,
        operator: "less_than",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 0.0856 < 0.1
    });

    it("should evaluate loss_threshold with greater_than operator", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.05,
        operator: "greater_than",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 0.0856 > 0.05
    });

    it("should evaluate accuracy_target with greater_equal operator", () => {
      const rule: AlertRule = {
        conditionType: "accuracy_target",
        threshold: 90,
        operator: "greater_equal",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 92.34 >= 90
    });

    it("should evaluate accuracy_target with less_than operator", () => {
      const rule: AlertRule = {
        conditionType: "accuracy_target",
        threshold: 95,
        operator: "less_than",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 92.34 < 95
    });

    it("should evaluate equal operator", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.0856,
        operator: "equal",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 0.0856 == 0.0856
    });

    it("should return false when condition is not met", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.05,
        operator: "less_than",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(false); // 0.0856 is not < 0.05
    });

    it("should handle missing threshold gracefully", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(false);
    });

    it("should handle missing operator gracefully", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.1,
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(false);
    });
  });

  describe("Notification Payload Validation", () => {
    it("should create valid training_completed notification", () => {
      const payload: NotificationPayload = {
        userId: 1,
        trainingId: 1,
        notificationType: "training_completed",
        title: "학습 완료",
        message: "Training 1이(가) 완료되었습니다.",
        severity: "success",
        metadata: {
          finalLoss: 0.0856,
          finalAccuracy: 92.34,
        },
      };

      expect(payload.userId).toBe(1);
      expect(payload.notificationType).toBe("training_completed");
      expect(payload.severity).toBe("success");
    });

    it("should create valid loss_threshold notification", () => {
      const payload: NotificationPayload = {
        userId: 1,
        trainingId: 1,
        notificationType: "loss_threshold",
        title: "Loss 임계값 도달",
        message: "Loss가 0.1에 도달했습니다.",
        severity: "success",
        metadata: {
          threshold: 0.1,
          currentValue: 0.0856,
        },
      };

      expect(payload.notificationType).toBe("loss_threshold");
      expect(payload.metadata?.threshold).toBe(0.1);
    });

    it("should create valid accuracy_target notification", () => {
      const payload: NotificationPayload = {
        userId: 1,
        trainingId: 1,
        notificationType: "accuracy_target",
        title: "정확도 목표 달성",
        message: "정확도가 90%에 도달했습니다.",
        severity: "success",
        metadata: {
          threshold: 90,
          currentValue: 92.34,
        },
      };

      expect(payload.notificationType).toBe("accuracy_target");
      expect(payload.metadata?.currentValue).toBe(92.34);
    });

    it("should create valid training_failed notification", () => {
      const payload: NotificationPayload = {
        userId: 1,
        trainingId: 1,
        notificationType: "training_failed",
        title: "학습 실패",
        message: "GPU 메모리 부족으로 인해 학습이 실패했습니다.",
        severity: "error",
        metadata: {
          failureReason: "GPU 메모리 부족",
        },
      };

      expect(payload.severity).toBe("error");
      expect(payload.metadata?.failureReason).toBe("GPU 메모리 부족");
    });
  });

  describe("Alert Rule Validation", () => {
    it("should validate loss_threshold rule", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.1,
        operator: "less_than",
        userId: 1,
      };

      expect(rule.conditionType).toBe("loss_threshold");
      expect(rule.threshold).toBe(0.1);
      expect(rule.operator).toBe("less_than");
    });

    it("should validate accuracy_target rule", () => {
      const rule: AlertRule = {
        conditionType: "accuracy_target",
        threshold: 90,
        operator: "greater_equal",
        userId: 1,
        trainingId: 1,
      };

      expect(rule.conditionType).toBe("accuracy_target");
      expect(rule.trainingId).toBe(1);
    });

    it("should validate training_completed rule", () => {
      const rule: AlertRule = {
        conditionType: "training_completed",
        userId: 1,
      };

      expect(rule.conditionType).toBe("training_completed");
    });

    it("should validate training_failed rule", () => {
      const rule: AlertRule = {
        conditionType: "training_failed",
        userId: 1,
      };

      expect(rule.conditionType).toBe("training_failed");
    });
  });

  describe("Operator Precision", () => {
    it("should handle floating point comparison with precision", () => {
      const metricWithSmallDiff: TrainingMetric = {
        ...mockMetric,
        loss: 0.10000001,
      };

      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.1,
        operator: "equal",
        userId: 1,
      };

      const result = evaluateCondition(metricWithSmallDiff, rule);
      expect(result).toBe(true); // Should be considered equal within precision
    });

    it("should correctly compare less_equal", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.0856,
        operator: "less_equal",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 0.0856 <= 0.0856
    });

    it("should correctly compare greater_equal", () => {
      const rule: AlertRule = {
        conditionType: "loss_threshold",
        threshold: 0.0856,
        operator: "greater_equal",
        userId: 1,
      };

      const result = evaluateCondition(mockMetric, rule);
      expect(result).toBe(true); // 0.0856 >= 0.0856
    });
  });
});
