import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Models table - AI 모델 정보 관리
 */
export const models = mysqlTable("models", {
  id: int("id").autoincrement().primaryKey(),
  modelId: varchar("modelId", { length: 128 }).notNull().unique(),
  modelName: varchar("modelName", { length: 255 }).notNull(),
  releaseDate: timestamp("releaseDate"),
  description: text("description"),
  contextLength: varchar("contextLength", { length: 50 }),
  parameters: varchar("parameters", { length: 100 }),
  cpuRequired: int("cpuRequired"),
  memoryRequired: int("memoryRequired"), // GB
  gpuRequired: int("gpuRequired"),
  gpuMemoryRequired: int("gpuMemoryRequired"), // GB
  modelIcon: varchar("modelIcon", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

/**
 * Images table - 학습/추론용 컨테이너 이미지 관리
 */
export const images = mysqlTable("images", {
  id: int("id").autoincrement().primaryKey(),
  imageId: varchar("imageId", { length: 128 }).notNull().unique(),
  imageName: varchar("imageName", { length: 255 }).notNull(),
  releaseDate: timestamp("releaseDate"),
  description: text("description"),
  imageSizeGB: int("imageSizeGB"),
  imageType: mysqlEnum("imageType", ["training", "inference"]).notNull(),
  registryHost: varchar("registryHost", { length: 255 }),
  registryTag: varchar("registryTag", { length: 100 }),
  registryProject: varchar("registryProject", { length: 100 }),
  registryImageTag: varchar("registryImageTag", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Image = typeof images.$inferSelect;
export type InsertImage = typeof images.$inferInsert;

/**
 * Projects table - 프로젝트 관리
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 128 }).notNull().unique(),
  projectName: varchar("projectName", { length: 255 }).notNull(),
  description: text("description"),
  adminId: int("adminId").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  isCreated: boolean("isCreated").default(false).notNull(), // 1차 저장 vs 최종 생성
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Deployments table - 모델 배포 이력 관리
 */
export const deployments = mysqlTable("deployments", {
  id: int("id").autoincrement().primaryKey(),
  deploymentId: varchar("deploymentId", { length: 128 }).notNull().unique(),
  modelId: int("modelId").notNull(),
  imageId: int("imageId").notNull(),
  deploymentName: varchar("deploymentName", { length: 255 }),
  tensorParallelSize: int("tensorParallelSize"),
  maxModelLen: int("maxModelLen"),
  gpuMemoryUtilization: decimal("gpuMemoryUtilization", { precision: 3, scale: 2 }),
  resourceGroupId: varchar("resourceGroupId", { length: 128 }),
  resourcePreset: varchar("resourcePreset", { length: 100 }),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
  callCount: int("callCount").default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

/**
 * Trainings table - 모델 학습 이력 관리
 */
export const trainings = mysqlTable("trainings", {
  id: int("id").autoincrement().primaryKey(),
  trainingId: varchar("trainingId", { length: 128 }).notNull().unique(),
  baseModelId: int("baseModelId").notNull(),
  trainingName: varchar("trainingName", { length: 255 }),
  modelType: varchar("modelType", { length: 100 }), // CNN, RNN, LSTM, BERT, GPT, etc.
  trainingObjective: varchar("trainingObjective", { length: 100 }), // Classification, Regression, etc.
  schedule: mysqlEnum("schedule", ["immediate", "scheduled"]).default("immediate"),
  scheduledTime: timestamp("scheduledTime"),
  trainingDataIds: text("trainingDataIds"), // JSON array of training data IDs
  batchSize: int("batchSize"),
  learningRate: decimal("learningRate", { precision: 8, scale: 6 }),
  epochs: int("epochs"),
  earlyStopping: boolean("earlyStopping").default(false),
  earlyStoppingPatience: int("earlyStoppingPatience"),
  loraAlpha: int("loraAlpha"),
  loraR: int("loraR"),
  loraTargetModules: text("loraTargetModules"), // JSON array
  loraDropout: decimal("loraDropout", { precision: 3, scale: 2 }),
  fp16Optimizer: boolean("fp16Optimizer").default(false),
  resourceGroupId: varchar("resourceGroupId", { length: 128 }),
  resourcePreset: varchar("resourcePreset", { length: 100 }),
  estimatedTrainingTime: int("estimatedTrainingTime"), // minutes
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending"),
  gpuUsage: decimal("gpuUsage", { precision: 5, scale: 2 }),
  loss: decimal("loss", { precision: 10, scale: 6 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Training = typeof trainings.$inferSelect;
export type InsertTraining = typeof trainings.$inferInsert;

/**
 * APIs table - API 정보 관리
 */
export const apis = mysqlTable("apis", {
  id: int("id").autoincrement().primaryKey(),
  apiId: varchar("apiId", { length: 128 }).notNull().unique(),
  apiName: varchar("apiName", { length: 255 }).notNull(),
  description: text("description"),
  endpoint: varchar("endpoint", { length: 500 }),
  deploymentId: int("deploymentId"),
  status: mysqlEnum("status", ["active", "inactive"]).default("active"),
  callCount: int("callCount").default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Api = typeof apis.$inferSelect;
export type InsertApi = typeof apis.$inferInsert;

/**
 * API Keys table - API 키 관리
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: varchar("apiKeyId", { length: 128 }).notNull().unique(),
  apiId: int("apiId").notNull(),
  keyName: varchar("keyName", { length: 255 }).notNull(),
  keyValue: varchar("keyValue", { length: 255 }).notNull().unique(),
  expiryDate: timestamp("expiryDate"),
  usageLimit: int("usageLimit"),
  usageCount: int("usageCount").default(0),
  status: mysqlEnum("status", ["active", "inactive", "expired"]).default("active"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Evaluations table - 모델 평가 관리
 */
export const evaluations = mysqlTable("evaluations", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: varchar("evaluationId", { length: 128 }).notNull().unique(),
  modelId: int("modelId").notNull(),
  evaluationName: varchar("evaluationName", { length: 255 }),
  evaluationType: varchar("evaluationType", { length: 100 }),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending"),
  qualityScore: decimal("qualityScore", { precision: 5, scale: 2 }),
  evaluationData: text("evaluationData"), // JSON
  resultSummary: text("resultSummary"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

/**
 * Anomaly Detections table - 이상 탐지 관리
 */
export const anomalyDetections = mysqlTable("anomalyDetections", {
  id: int("id").autoincrement().primaryKey(),
  anomalyId: varchar("anomalyId", { length: 128 }).notNull().unique(),
  deploymentId: int("deploymentId").notNull(),
  anomalyType: varchar("anomalyType", { length: 100 }),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  description: text("description"),
  detectedAt: timestamp("detectedAt").defaultNow(),
  status: mysqlEnum("status", ["detected", "investigating", "resolved"]).default("detected"),
  resolution: text("resolution"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type InsertAnomalyDetection = typeof anomalyDetections.$inferInsert;

/**
 * Resource Groups table - 자원 그룹 관리
 */
export const resourceGroups = mysqlTable("resourceGroups", {
  id: int("id").autoincrement().primaryKey(),
  resourceGroupId: varchar("resourceGroupId", { length: 128 }).notNull().unique(),
  groupName: varchar("groupName", { length: 255 }).notNull(),
  description: text("description"),
  totalGPU: int("totalGPU"),
  totalCPU: int("totalCPU"),
  totalMemoryGB: int("totalMemoryGB"),
  usedGPU: int("usedGPU").default(0),
  usedCPU: int("usedCPU").default(0),
  usedMemoryGB: int("usedMemoryGB").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceGroup = typeof resourceGroups.$inferSelect;
export type InsertResourceGroup = typeof resourceGroups.$inferInsert;
