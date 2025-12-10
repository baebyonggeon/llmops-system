import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { processMetricAlerts, notifyTrainingCompleted, notifyTrainingStarted } from "./notificationEngine";

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
function generateMetric(trainingId: number, epoch: number, batchesProcessed: number, totalBatches: number): TrainingMetric {
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

export function initializeTrainingMetricsServer(io: SocketIOServer) {
  const metricsNamespace = io.of("/training-metrics");

  metricsNamespace.on("connection", (socket: Socket) => {
    console.log(`[Training Metrics] Client connected: ${socket.id}`);

    // Subscribe to a specific training session
    socket.on("subscribe", (trainingId: number) => {
      socket.join(`training-${trainingId}`);
      console.log(`[Training Metrics] Client ${socket.id} subscribed to training ${trainingId}`);

      // Send current session data if it exists
      const session = activeSessions.get(trainingId);
      if (session) {
        socket.emit("session-update", session);
      }
    });

    // Unsubscribe from a training session
    socket.on("unsubscribe", (trainingId: number) => {
      socket.leave(`training-${trainingId}`);
      console.log(`[Training Metrics] Client ${socket.id} unsubscribed from training ${trainingId}`);
    });

    // Start training simulation
    socket.on("start-training", (trainingId: number, config: { epochs: number; totalBatches: number }) => {
      console.log(`[Training Metrics] Starting training ${trainingId}`);

      const session: TrainingSession = {
        trainingId,
        status: "running",
        startTime: Date.now(),
        metrics: [],
      };

      activeSessions.set(trainingId, session);

      // Notify training started
      const userId = 1;
      notifyTrainingStarted(trainingId, userId, `Training ${trainingId}`).catch((err) =>
        console.error("[Training Metrics] Error notifying training start:", err)
      );

      // Simulate training progress
      let currentEpoch = 0;
      const epochInterval = setInterval(() => {
        if (currentEpoch >= config.epochs) {
          session.status = "completed";
          metricsNamespace.to(`training-${trainingId}`).emit("training-completed", session);

          // Notify training completed
          if (session.metrics.length > 0) {
            const finalMetric = session.metrics[session.metrics.length - 1];
            notifyTrainingCompleted(trainingId, userId, finalMetric).catch((err) =>
              console.error("[Training Metrics] Error notifying training completion:", err)
            );
          }

          clearInterval(epochInterval);
          return;
        }

        // Simulate batch processing within an epoch
        for (let batch = 0; batch < config.totalBatches; batch++) {
          const metric = generateMetric(trainingId, currentEpoch, batch + 1, config.totalBatches);
          session.metrics.push(metric);

          // Keep only last 100 metrics to avoid memory issues
          if (session.metrics.length > 100) {
            session.metrics.shift();
          }

          // Emit metric update to all subscribers
          metricsNamespace.to(`training-${trainingId}`).emit("metric-update", metric);

          // Process metric-based alerts
          const userId = 1;
          processMetricAlerts(metric, userId).catch((err) =>
            console.error("[Training Metrics] Error processing alerts:", err)
          );
        }

        currentEpoch++;
      }, 2000); // Update every 2 seconds per epoch

      socket.emit("training-started", { trainingId, status: "running" });
    });

    // Stop training
    socket.on("stop-training", (trainingId: number) => {
      const session = activeSessions.get(trainingId);
      if (session) {
        session.status = "completed";
        metricsNamespace.to(`training-${trainingId}`).emit("training-stopped", session);
      }
    });

    // Pause training
    socket.on("pause-training", (trainingId: number) => {
      const session = activeSessions.get(trainingId);
      if (session) {
        session.status = "paused";
        metricsNamespace.to(`training-${trainingId}`).emit("training-paused", session);
      }
    });

    // Resume training
    socket.on("resume-training", (trainingId: number) => {
      const session = activeSessions.get(trainingId);
      if (session) {
        session.status = "running";
        metricsNamespace.to(`training-${trainingId}`).emit("training-resumed", session);
      }
    });

    // Get current session state
    socket.on("get-session", (trainingId: number) => {
      const session = activeSessions.get(trainingId);
      if (session) {
        socket.emit("session-state", session);
      } else {
        socket.emit("session-not-found", trainingId);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Training Metrics] Client disconnected: ${socket.id}`);
    });
  });

  return metricsNamespace;
}

export function getActiveSessions() {
  return Array.from(activeSessions.values());
}

export function getSessionMetrics(trainingId: number) {
  return activeSessions.get(trainingId);
}
