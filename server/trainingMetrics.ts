import { Server as HTTPServer } from "http";
import { notificationEngine } from "./notificationEngine";

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

// In-memory storage for active training sessions
const activeSessions = new Map<number, TrainingSession>();

// Simulated metric generators for demo purposes
function generateMetric(
  trainingId: number,
  epoch: number,
  batchesProcessed: number,
  totalBatches: number
): TrainingMetric {
  // Simulate loss decreasing over time
  const baseLoss = 2.0;
  const lossDecay = Math.exp(-epoch / 10);
  const loss = baseLoss * lossDecay + Math.random() * 0.1;

  // Simulate accuracy increasing over time
  const accuracy = Math.min(95, 50 + epoch * 4.5 + Math.random() * 5);

  // Simulate GPU usage
  const gpuUsage = 70 + Math.random() * 25;

  // Simulate CPU usage
  const cpuUsage = 40 + Math.random() * 20;

  // Simulate memory usage
  const memoryUsage = 60 + Math.random() * 30;

  return {
    trainingId,
    epoch,
    loss: Math.max(0.01, loss),
    accuracy: Math.min(100, accuracy),
    gpuUsage,
    cpuUsage,
    memoryUsage,
    batchesProcessed,
    totalBatches,
    timestamp: Date.now(),
  };
}

export function initializeTrainingMetrics(io: any) {
  // Start training
  io.on("connection", (socket: any) => {
    socket.on("training:start", async (data: { trainingId: number; totalEpochs: number }) => {
      const { trainingId, totalEpochs } = data;

      if (activeSessions.has(trainingId)) {
        socket.emit("training:error", { message: "Training already running" });
        return;
      }

      const session: TrainingSession = {
        trainingId,
        status: "running",
        startTime: Date.now(),
        metrics: [],
      };

      activeSessions.set(trainingId, session);
      socket.emit("training:started", { trainingId, startTime: session.startTime });

      // Simulate training loop
      let epoch = 0;
      const totalBatches = 100;

      const trainingInterval = setInterval(async () => {
        if (!activeSessions.has(trainingId)) {
          clearInterval(trainingInterval);
          return;
        }

        const currentSession = activeSessions.get(trainingId)!;

        if (currentSession.status !== "running") {
          clearInterval(trainingInterval);
          return;
        }

        if (epoch >= totalEpochs) {
          // Training completed
          currentSession.status = "completed";
          const finalMetrics = currentSession.metrics[currentSession.metrics.length - 1];

          socket.emit("training:completed", {
            trainingId,
            metrics: finalMetrics,
            duration: Date.now() - session.startTime,
          });

          // Send notification
          try {
            await notificationEngine.notifyTrainingCompleted(1, trainingId, {
              loss: finalMetrics?.loss || 0,
              accuracy: finalMetrics?.accuracy || 0,
              duration: Date.now() - session.startTime,
            });
          } catch (err: any) {
            console.error("[TrainingMetrics] Notification error:", err.message);
          }

          activeSessions.delete(trainingId);
          clearInterval(trainingInterval);
          return;
        }

        // Generate metrics for current epoch
        for (let batch = 0; batch < totalBatches; batch++) {
          const metric = generateMetric(trainingId, epoch, batch, totalBatches);
          currentSession.metrics.push(metric);

          // Emit metric update
          socket.emit("training:metric", metric);

          // Check for alert conditions
          if (metric.loss < 0.1) {
            try {
              await notificationEngine.notifyLossThresholdReached(1, trainingId, metric.loss, 0.1);
            } catch (err: any) {
              console.error("[TrainingMetrics] Notification error:", err.message);
            }
          }

          if (metric.accuracy > 90) {
            try {
              await notificationEngine.notifyAccuracyTargetReached(1, trainingId, metric.accuracy, 90);
            } catch (err: any) {
              console.error("[TrainingMetrics] Notification error:", err.message);
            }
          }

          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        epoch++;
      }, 1000);
    });

    // Pause training
    socket.on("training:pause", (data: { trainingId: number }) => {
      const session = activeSessions.get(data.trainingId);
      if (session) {
        session.status = "paused";
        socket.emit("training:paused", { trainingId: data.trainingId });
      }
    });

    // Resume training
    socket.on("training:resume", (data: { trainingId: number }) => {
      const session = activeSessions.get(data.trainingId);
      if (session) {
        session.status = "running";
        socket.emit("training:resumed", { trainingId: data.trainingId });
      }
    });

    // Stop training
    socket.on("training:stop", (data: { trainingId: number }) => {
      const session = activeSessions.get(data.trainingId);
      if (session) {
        session.status = "failed";
        socket.emit("training:stopped", { trainingId: data.trainingId });
        activeSessions.delete(data.trainingId);
      }
    });

    // Get active sessions
    socket.on("training:list", () => {
      const sessions = Array.from(activeSessions.values()).map((s) => ({
        trainingId: s.trainingId,
        status: s.status,
        startTime: s.startTime,
        metricsCount: s.metrics.length,
      }));
      socket.emit("training:sessions", sessions);
    });
  });
}
