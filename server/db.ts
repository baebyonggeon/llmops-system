import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  models,
  images,
  projects,
  deployments,
  trainings,
  apis,
  apiKeys,
  evaluations,
  anomalyDetections,
  resourceGroups,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Models ==========
export async function getModels(filters?: { isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(models);
}

export async function getModelById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return result[0];
}

export async function getModelByModelId(modelId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(models).where(eq(models.modelId, modelId)).limit(1);
  return result[0];
}

// ========== Images ==========
export async function getImages(filters?: { imageType?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(images);
}

export async function getImageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return result[0];
}

// ========== Projects ==========
export async function getProjects(filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects);
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

// ========== Deployments ==========
export async function getDeployments(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deployments);
}

export async function getDeploymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deployments).where(eq(deployments.id, id)).limit(1);
  return result[0];
}

// ========== Trainings ==========
export async function getTrainings(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(trainings);
}

export async function getTrainingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trainings).where(eq(trainings.id, id)).limit(1);
  return result[0];
}

// ========== APIs ==========
export async function getApisList(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(apis);
}

export async function getApiById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apis).where(eq(apis.id, id)).limit(1);
  return result[0];
}

// ========== API Keys ==========
export async function getApiKeysList(apiId?: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(apiKeys);
}

export async function getApiKeyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);
  return result[0];
}

// ========== Evaluations ==========
export async function getEvaluationsList(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(evaluations);
}

export async function getEvaluationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(evaluations).where(eq(evaluations.id, id)).limit(1);
  return result[0];
}

// ========== Anomaly Detections ==========
export async function getAnomalyDetectionsList(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(anomalyDetections);
}

export async function getAnomalyDetectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(anomalyDetections).where(eq(anomalyDetections.id, id)).limit(1);
  return result[0];
}

// ========== Resource Groups ==========
export async function getResourceGroupsList() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(resourceGroups);
}

export async function getResourceGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resourceGroups).where(eq(resourceGroups.id, id)).limit(1);
  return result[0];
}
