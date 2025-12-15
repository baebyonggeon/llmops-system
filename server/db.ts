import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertMbrBas,
  mbrBas,
  pjtBas,
  llmBas,
  apiBas,
  apiUsageRealtime,
  apikeyBas,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _client = postgres(process.env.DATABASE_URL);
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _client = null;
    }
  }
  return _db;
}

// Member functions
export async function getMemberByUuid(mbrUuid: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get member: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(mbrBas)
    .where(eq(mbrBas.mbrUuid, mbrUuid))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function upsertMember(member: InsertMbrBas): Promise<void> {
  if (!member.mbrUuid) {
    throw new Error("Member mbrUuid is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert member: database not available");
    return;
  }

  try {
    const existing = await getMemberByUuid(member.mbrUuid);
    
    if (existing) {
      await db
        .update(mbrBas)
        .set({
          ...member,
          amdDt: new Date(),
        })
        .where(eq(mbrBas.mbrUuid, member.mbrUuid));
    } else {
      await db.insert(mbrBas).values(member);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert member:", error);
    throw error;
  }
}

// Project functions
export async function getProjectById(pjtId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(pjtBas)
    .where(eq(pjtBas.pjtId, pjtId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listProjects(custCd: string) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pjtBas)
    .where(eq(pjtBas.custCd, custCd));
}

// LLM functions
export async function getLlmById(llmId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(llmBas)
    .where(eq(llmBas.llmId, llmId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listLlms() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(llmBas);
}

// API functions
export async function getApiById(apiId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(apiBas)
    .where(eq(apiBas.apiId, apiId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listApis(pjtId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (pjtId) {
    return await db
      .select()
      .from(apiBas)
      .where(eq(apiBas.pjtId, pjtId));
  }

  return await db.select().from(apiBas);
}

// API Key functions
export async function getApiKeyById(keyId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(apikeyBas)
    .where(eq(apikeyBas.keyId, keyId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listApiKeys(apiId?: number, pjtId?: number) {
  const db = await getDb();
  if (!db) return [];

  if (apiId) {
    return await db
      .select()
      .from(apikeyBas)
      .where(eq(apikeyBas.apiId, apiId));
  } else if (pjtId) {
    return await db
      .select()
      .from(apikeyBas)
      .where(eq(apikeyBas.pjtId, pjtId));
  }

  return await db.select().from(apikeyBas);
}

// API Usage functions
export async function getApiUsageByProjectAndApi(pjtId: number, apiId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { and } = await import("drizzle-orm");
  const result = await db
    .select()
    .from(apiUsageRealtime)
    .where(
      and(
        eq(apiUsageRealtime.pjtId, pjtId),
        eq(apiUsageRealtime.apiId, apiId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listApiUsageByProject(pjtId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(apiUsageRealtime)
    .where(eq(apiUsageRealtime.pjtId, pjtId));
}

// Database cleanup
export async function closeDb() {
  if (_client) {
    await _client.end();
    _client = null;
    _db = null;
  }
}
