import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface TrainingMetric {
  trainingId: number;
  epoch: number;
  loss: number;
  accuracy: number;
  gpuUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  batchesProcessed: number;
  totalBatches: number;
  timestamp: number;
}

export interface TrainingSession {
  trainingId: number;
  status: "running" | "paused" | "completed" | "failed";
  startTime: number;
  metrics: TrainingMetric[];
}

interface UseTrainingMetricsOptions {
  trainingId: number;
  autoConnect?: boolean;
}

export function useTrainingMetrics({ trainingId, autoConnect = true }: UseTrainingMetricsOptions) {
  const [metrics, setMetrics] = useState<TrainingMetric[]>([]);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<"running" | "paused" | "completed" | "failed" | "idle">("idle");
  const socketRef = useRef<Socket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!autoConnect) return;

    const socket = io("/training-metrics", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Training Metrics] Connected");
      setIsConnected(true);
      // Subscribe to training session
      socket.emit("subscribe", trainingId);
    });

    socket.on("disconnect", () => {
      console.log("[Training Metrics] Disconnected");
      setIsConnected(false);
    });

    socket.on("metric-update", (metric: TrainingMetric) => {
      setMetrics((prev) => {
        const updated = [...prev, metric];
        // Keep only last 100 metrics for performance
        return updated.slice(-100);
      });
    });

    socket.on("session-update", (sessionData: TrainingSession) => {
      setSession(sessionData);
      setStatus(sessionData.status);
      setMetrics(sessionData.metrics);
    });

    socket.on("session-state", (sessionData: TrainingSession) => {
      setSession(sessionData);
      setStatus(sessionData.status);
      setMetrics(sessionData.metrics);
    });

    socket.on("training-started", ({ status: newStatus }: { status: string }) => {
      setStatus(newStatus as any);
    });

    socket.on("training-paused", (sessionData: TrainingSession) => {
      setStatus("paused");
      setSession(sessionData);
    });

    socket.on("training-resumed", (sessionData: TrainingSession) => {
      setStatus("running");
      setSession(sessionData);
    });

    socket.on("training-stopped", (sessionData: TrainingSession) => {
      setStatus("completed");
      setSession(sessionData);
    });

    socket.on("training-completed", (sessionData: TrainingSession) => {
      setStatus("completed");
      setSession(sessionData);
    });

    socket.on("session-not-found", () => {
      console.warn(`[Training Metrics] Session ${trainingId} not found`);
    });

    socket.on("connect_error", (error: Error) => {
      console.error("[Training Metrics] Connection error:", error);
    });

    return () => {
      if (socket) {
        socket.emit("unsubscribe", trainingId);
        socket.disconnect();
      }
    };
  }, [trainingId, autoConnect]);

  // Control functions
  const startTraining = useCallback(
    (config: { epochs: number; totalBatches: number }) => {
      if (socketRef.current) {
        socketRef.current.emit("start-training", trainingId, config);
      }
    },
    [trainingId]
  );

  const stopTraining = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("stop-training", trainingId);
    }
  }, [trainingId]);

  const pauseTraining = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("pause-training", trainingId);
    }
  }, [trainingId]);

  const resumeTraining = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("resume-training", trainingId);
    }
  }, [trainingId]);

  const getLatestMetric = useCallback(() => {
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }, [metrics]);

  const getMetricStats = useCallback(() => {
    if (metrics.length === 0) {
      return null;
    }

    const losses = metrics.map((m) => m.loss);
    const accuracies = metrics.map((m) => m.accuracy);
    const gpuUsages = metrics.map((m) => m.gpuUsage);

    return {
      minLoss: Math.min(...losses),
      maxLoss: Math.max(...losses),
      avgLoss: losses.reduce((a, b) => a + b, 0) / losses.length,
      minAccuracy: Math.min(...accuracies),
      maxAccuracy: Math.max(...accuracies),
      avgAccuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      avgGpuUsage: gpuUsages.reduce((a, b) => a + b, 0) / gpuUsages.length,
      totalMetrics: metrics.length,
    };
  }, [metrics]);

  return {
    metrics,
    session,
    status,
    isConnected,
    startTraining,
    stopTraining,
    pauseTraining,
    resumeTraining,
    getLatestMetric,
    getMetricStats,
  };
}
