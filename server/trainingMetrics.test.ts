import { describe, it, expect, beforeEach, vi } from "vitest";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "http";
import { initializeTrainingMetricsServer, getSessionMetrics, getActiveSessions } from "./trainingMetrics";

describe("Training Metrics Server", () => {
  let io: SocketIOServer;
  let httpServer: any;

  beforeEach(() => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      transports: ["websocket"],
    });
    initializeTrainingMetricsServer(io);
  });

  it("should initialize training metrics namespace", () => {
    const namespace = io.of("/training-metrics");
    expect(namespace).toBeDefined();
  });

  it("should handle client connection", (done) => {
    const namespace = io.of("/training-metrics");
    
    namespace.on("connection", (socket) => {
      expect(socket).toBeDefined();
      expect(socket.id).toBeDefined();
      done();
    });
  });

  it("should store training session on start-training event", (done) => {
    const trainingId = 1;
    const config = { epochs: 5, totalBatches: 10 };

    const namespace = io.of("/training-metrics");
    
    namespace.on("connection", (socket) => {
      socket.on("training-started", () => {
        // Give it a moment for the session to be stored
        setTimeout(() => {
          const session = getSessionMetrics(trainingId);
          expect(session).toBeDefined();
          expect(session?.trainingId).toBe(trainingId);
          expect(session?.status).toBe("running");
          done();
        }, 100);
      });

      socket.emit("start-training", trainingId, config);
    });
  });

  it("should generate metrics during training", (done) => {
    const trainingId = 2;
    const config = { epochs: 2, totalBatches: 5 };

    const namespace = io.of("/training-metrics");
    let metricsCount = 0;

    namespace.on("connection", (socket) => {
      socket.on("metric-update", (metric) => {
        metricsCount++;
        expect(metric).toBeDefined();
        expect(metric.trainingId).toBe(trainingId);
        expect(metric.loss).toBeGreaterThan(0);
        expect(metric.accuracy).toBeGreaterThanOrEqual(0);
        expect(metric.accuracy).toBeLessThanOrEqual(100);
        expect(metric.gpuUsage).toBeGreaterThanOrEqual(0);
        expect(metric.gpuUsage).toBeLessThanOrEqual(100);
        expect(metric.timestamp).toBeGreaterThan(0);

        if (metricsCount >= 5) {
          done();
        }
      });

      socket.emit("start-training", trainingId, config);
    });
  }, 15000);

  it("should pause training session", (done) => {
    const trainingId = 3;
    const config = { epochs: 10, totalBatches: 20 };

    const namespace = io.of("/training-metrics");

    namespace.on("connection", (socket) => {
      socket.on("training-paused", (session) => {
        expect(session.status).toBe("paused");
        done();
      });

      socket.on("training-started", () => {
        setTimeout(() => {
          socket.emit("pause-training", trainingId);
        }, 500);
      });

      socket.emit("start-training", trainingId, config);
    });
  }, 10000);

  it("should resume paused training session", (done) => {
    const trainingId = 4;
    const config = { epochs: 10, totalBatches: 20 };

    const namespace = io.of("/training-metrics");
    let pauseReceived = false;

    namespace.on("connection", (socket) => {
      socket.on("training-paused", (session) => {
        pauseReceived = true;
        expect(session.status).toBe("paused");
        setTimeout(() => {
          socket.emit("resume-training", trainingId);
        }, 200);
      });

      socket.on("training-resumed", (session) => {
        if (pauseReceived) {
          expect(session.status).toBe("running");
          done();
        }
      });

      socket.on("training-started", () => {
        setTimeout(() => {
          socket.emit("pause-training", trainingId);
        }, 500);
      });

      socket.emit("start-training", trainingId, config);
    });
  }, 10000);

  it("should stop training session", (done) => {
    const trainingId = 5;
    const config = { epochs: 10, totalBatches: 20 };

    const namespace = io.of("/training-metrics");

    namespace.on("connection", (socket) => {
      socket.on("training-stopped", (session) => {
        expect(session.status).toBe("completed");
        done();
      });

      socket.on("training-started", () => {
        setTimeout(() => {
          socket.emit("stop-training", trainingId);
        }, 500);
      });

      socket.emit("start-training", trainingId, config);
    });
  }, 10000);

  it("should maintain metric history", (done) => {
    const trainingId = 6;
    const config = { epochs: 3, totalBatches: 5 };

    const namespace = io.of("/training-metrics");
    let metricsReceived = 0;

    namespace.on("connection", (socket) => {
      socket.on("metric-update", () => {
        metricsReceived++;
      });

      socket.on("training-completed", (session) => {
        expect(session.metrics.length).toBeGreaterThan(0);
        expect(session.metrics.length).toBeLessThanOrEqual(100); // Max 100 metrics
        done();
      });

      socket.emit("start-training", trainingId, config);
    });
  }, 15000);

  it("should return active sessions", (done) => {
    const trainingId = 7;
    const config = { epochs: 2, totalBatches: 5 };

    const namespace = io.of("/training-metrics");

    namespace.on("connection", (socket) => {
      socket.on("training-started", () => {
        setTimeout(() => {
          const sessions = getActiveSessions();
          expect(sessions.length).toBeGreaterThan(0);
          expect(sessions.some((s) => s.trainingId === trainingId)).toBe(true);
          done();
        }, 100);
      });

      socket.emit("start-training", trainingId, config);
    });
  });

  it("should handle subscription to specific training", (done) => {
    const trainingId = 8;

    const namespace = io.of("/training-metrics");

    namespace.on("connection", (socket) => {
      socket.on("subscribe", () => {
        expect(socket.rooms.has(`training-${trainingId}`)).toBe(true);
        done();
      });

      socket.emit("subscribe", trainingId);
    });
  });
});
