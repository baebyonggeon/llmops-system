import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  date,
  primaryKey,
  foreignKey,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ==========================================
// COMMON CODE TABLE
// ==========================================
export const sysComCd = pgTable(
  "sys_com_cd",
  {
    lcffCd: varchar("lcff_cd", { length: 50 }).notNull(),
    sclffCd: varchar("sclff_cd", { length: 50 }).notNull(),
    lcffNm: varchar("lcff_nm", { length: 200 }),
    sclffNm: varchar("sclff_nm", { length: 200 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.lcffCd, table.sclffCd] }),
  })
);

// ==========================================
// MEMBER DOMAIN
// ==========================================
export const mbrBas = pgTable(
  "mbr_bas",
  {
    mbrId: serial("mbr_id").primaryKey(),
    custCd: varchar("cust_cd", { length: 50 }),
    mbrTypeCd: varchar("mbr_type_cd", { length: 50 }),
    id: varchar("id", { length: 100 }).unique(),
    mbrNm: varchar("mbr_nm", { length: 200 }),
    pwd: varchar("pwd", { length: 255 }),
    mbrUuid: varchar("mbr_uuid", { length: 100 }).unique(),
    mbrSttusCd: varchar("mbr_sttus_cd", { length: 50 }),
    mbrClassId: varchar("mbr_class_id", { length: 50 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    emailAthn: varchar("email_athn", { length: 100 }),
    tmpPwdIssYn: varchar("tmp_pwd_iss_yn", { length: 1 }).default("N"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
  },
  (table) => ({
    custCdIdx: index("idx_mbr_bas_cust_cd").on(table.custCd),
    mbrUuidIdx: index("idx_mbr_bas_mbr_uuid").on(table.mbrUuid),
  })
);

// ==========================================
// PROJECT DOMAIN
// ==========================================
export const pjtBas = pgTable(
  "pjt_bas",
  {
    pjtId: serial("pjt_id").primaryKey(),
    custCd: varchar("cust_cd", { length: 50 }).notNull(),
    pjtNm: varchar("pjt_nm", { length: 200 }),
    pjtDscrt: text("pjt_dscrt"),
    delYn: varchar("del_yn", { length: 1 }).default("N"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
    stateCd: varchar("state_cd", { length: 50 }),
    pjtUuid: varchar("pjt_uuid", { length: 100 }).unique(),
    reason: text("reason"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.pjtId, table.custCd] }),
    custCdIdx: index("idx_pjt_bas_cust_cd").on(table.custCd),
    pjtUuidIdx: index("idx_pjt_bas_pjt_uuid").on(table.pjtUuid),
  })
);

export const pjtMbrAutMap = pgTable(
  "pjt_mbr_aut_map",
  {
    pjtId: integer("pjt_id").notNull(),
    custCd: varchar("cust_cd", { length: 50 }).notNull(),
    mbrUuid: varchar("mbr_uuid", { length: 100 }).notNull(),
    favYn: varchar("fav_yn", { length: 1 }).default("N"),
    auth: varchar("auth", { length: 50 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    mbrTypeCd: varchar("mbr_type_cd", { length: 50 }),
    id: serial("id").primaryKey(),
  },
  (table) => ({
    fk_pjt: foreignKey({ columns: [table.pjtId, table.custCd], foreignColumns: [pjtBas.pjtId, pjtBas.custCd], name: "fk_pjt_mbr_aut_pjt" }),
    pjtIdIdx: index("idx_pjt_mbr_aut_pjt_id").on(table.pjtId),
    mbrUuidIdx: index("idx_pjt_mbr_aut_mbr_uuid").on(table.mbrUuid),
  })
);

export const pjtResourceConfig = pgTable(
  "pjt_resource_config",
  {
    pjtId: integer("pjt_id").primaryKey(),
    pjtUuid: varchar("pjt_uuid", { length: 100 }),
    isActive: boolean("is_active").default(true),
    domain: varchar("domain", { length: 255 }),
    resourcePolicy: text("resource_policy"),
    allowedResourceGroups: text("allowed_resource_groups"),
    allowedFolderHosts: text("allowed_folder_hosts"),
    maxAllowedCpu: integer("max_allowed_cpu"),
    maxAllowedMemory: integer("max_allowed_memory"),
    containerRegistry: varchar("container_registry", { length: 255 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
    custCc: varchar("cust_cc", { length: 50 }),
  },
  (table) => ({
    fk_pjt: foreignKey({ columns: [table.pjtId], foreignColumns: [pjtBas.pjtId], name: "fk_pjt_resource_config_pjt" }),
  })
);

// ==========================================
// MODEL / IMAGE / DEPLOY DOMAIN
// ==========================================
export const mdlCatalog = pgTable(
  "mdl_catalog",
  {
    llmId: integer("llm_id").notNull(),
    mdlCtgryCd: varchar("mdl_ctgry_cd", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 100 }),
    dscrt: text("dscrt"),
    mdlLink: varchar("mdl_link", { length: 255 }),
    dpYn: varchar("dp_yn", { length: 1 }).default("N"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.llmId, table.mdlCtgryCd] }),
  })
);

export const llmBas = pgTable(
  "llm_bas",
  {
    llmId: serial("llm_id").primaryKey(),
    llmNnr: varchar("llm_nnr", { length: 100 }),
    llmType: varchar("llm_type", { length: 50 }),
    llmVer: varchar("llm_ver", { length: 50 }),
    llmDscrt: text("llm_dscrt"),
    llmDtl: text("llm_dtl"),
    dpInstCnt: integer("dp_inst_cnt"),
    dpInstDscrt: text("dp_inst_dscrt"),
    storeType: varchar("store_type", { length: 50 }),
    storeUrl: varchar("store_url", { length: 255 }),
    storeUsr: varchar("store_usr", { length: 100 }),
    storePwd: varchar("store_pwd", { length: 255 }),
    mdlType: varchar("mdl_type", { length: 50 }),
    mdlSize: varchar("mdl_size", { length: 50 }),
    mdlStrtg: varchar("mdl_strtg", { length: 50 }),
    pubYn: varchar("pub_yn", { length: 1 }).default("N"),
    delYn: varchar("del_yn", { length: 1 }).default("N"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
    strmYn: varchar("strm_yn", { length: 1 }).default("N"),
    contextWindowLength: integer("context_window_length"),
    embeddingYn: varchar("embedding_yn", { length: 1 }).default("N"),
    evlYn: varchar("evl_yn", { length: 1 }).default("N"),
    holderYn: varchar("holder_yn", { length: 1 }).default("N"),
    llmParam: text("llm_param"),
  },
  (table) => ({
    llmNnrIdx: index("idx_llm_bas_llm_nnr").on(table.llmNnr),
  })
);

export const llmImage = pgTable(
  "llm_image",
  {
    imageId: serial("image_id").primaryKey(),
    imageDscrt: text("image_dscrt"),
    tag: varchar("tag", { length: 100 }),
    imageSaveFileNm: varchar("image_save_file_nm", { length: 255 }),
    imageFileExt: varchar("image_file_ext", { length: 20 }),
    imageFileSize: integer("image_file_size"),
    imageFileUrl: varchar("image_file_url", { length: 255 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
    imageRealFileNm: varchar("image_real_file_nm", { length: 255 }),
  },
  (table) => ({
    tagIdx: index("idx_llm_image_tag").on(table.tag),
  })
);

export const dpBas = pgTable(
  "dp_bas",
  {
    dpId: serial("dp_id").primaryKey(),
    custCd: varchar("cust_cd", { length: 50 }).notNull(),
    pjtId: integer("pjt_id"),
    llmId: integer("llm_id"),
    ftId: integer("ft_id"),
    apdplIds: text("apdpl_ids"),
    dataSetId: integer("data_set_id"),
    instCnt: integer("inst_cnt"),
    dpSttus: varchar("dp_sttus", { length: 50 }),
    delYn: varchar("del_yn", { length: 1 }).default("N"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    dpYn: varchar("dp_yn", { length: 1 }).default("N"),
    strmYn: varchar("strm_yn", { length: 1 }).default("N"),
    prompt: text("prompt"),
    dpDnsDt: timestamp("dp_dns_dt"),
    cnvsr: varchar("cnvsr", { length: 100 }),
    cmpl: varchar("cmpl", { length: 100 }),
    contFltr: text("cont_fltr"),
    contFlterId: integer("cont_fltr_id"),
    lastDpId: integer("last_dp_id"),
    lastDpUsr: varchar("last_dp_usr", { length: 100 }),
    dpGrpCode: varchar("dp_grp_code", { length: 50 }),
    dpVersion: varchar("dp_version", { length: 50 }),
    dpPrevDpId: integer("dp_prev_dp_id"),
    serviceId: integer("service_id"),
    deployParam: text("deploy_param"),
    apiId: integer("api_id"),
    runSttus: varchar("run_sttus", { length: 50 }),
    svcNnr: varchar("svc_nnr", { length: 100 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
  },
  (table) => ({
    fk_pjt: foreignKey({ columns: [table.pjtId], foreignColumns: [pjtBas.pjtId], name: "fk_dp_bas_pjt" }),
    fk_llm: foreignKey({ columns: [table.llmId], foreignColumns: [llmBas.llmId], name: "fk_dp_bas_llm" }),
    custCdIdx: index("idx_dp_bas_cust_cd").on(table.custCd),
    dpSttuIdx: index("idx_dp_bas_dp_sttus").on(table.dpSttus),
  })
);

// ==========================================
// API / USAGE / KEY / STATS DOMAIN
// ==========================================
export const apiBas = pgTable(
  "api_bas",
  {
    apiId: serial("api_id").primaryKey(),
    pjtId: integer("pjt_id"),
    apiNm: varchar("api_nm", { length: 200 }),
    apiDscrt: text("api_dscrt"),
    apiEndpoint: varchar("api_endpoint", { length: 255 }),
    apiMthd: varchar("api_mthd", { length: 50 }),
    apiVrsn: varchar("api_vrsn", { length: 50 }),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    delYn: varchar("del_yn", { length: 1 }).default("N"),
    status: varchar("status", { length: 50 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
  },
  (table) => ({
    fk_pjt: foreignKey({ columns: [table.pjtId], foreignColumns: [pjtBas.pjtId], name: "fk_api_bas_pjt" }),
    pjtIdIdx: index("idx_api_bas_pjt_id").on(table.pjtId),
  })
);

export const apiMpBas = pgTable(
  "api_mp_bas",
  {
    mpId: serial("mp_id").primaryKey(),
    custCd: varchar("cust_cd", { length: 50 }).notNull(),
    externalApiEp: varchar("external_api_ep", { length: 255 }),
    internalApiEp: varchar("internal_api_ep", { length: 255 }),
    apiId: integer("api_id"),
    apiKey: varchar("api_key", { length: 255 }),
    mpPriority: integer("mp_priority"),
    mpDscrt: text("mp_dscrt"),
    cacheTtlSec: integer("cache_ttl_sec"),
    lastCacheDt: timestamp("last_cache_dt"),
    useYn: varchar("use_yn", { length: 1 }).default("Y"),
    delYn: varchar("del_yn", { length: 1 }).default("N"),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdDt: timestamp("amd_dt").defaultNow(),
    cacheVer: varchar("cache_ver", { length: 50 }),
  },
  (table) => ({
    fk_api: foreignKey({ columns: [table.apiId], foreignColumns: [apiBas.apiId], name: "fk_api_mp_bas_api" }),
    custCdIdx: index("idx_api_mp_bas_cust_cd").on(table.custCd),
  })
);

export const apikeyBas = pgTable(
  "apikey_bas",
  {
    keyId: serial("key_id").primaryKey(),
    apiId: integer("api_id"),
    pjtId: integer("pjt_id"),
    custCd: varchar("cust_cd", { length: 50 }),
    apiKey: varchar("api_key", { length: 255 }).unique(),
    expireDate: date("expire_date"),
    rateLimitYn: varchar("rate_limit_yn", { length: 1 }).default("N"),
    monthlyUsageLimit: integer("monthly_usage_limit"),
    apikeyDesc: text("apikey_desc"),
    apikeyMngr: varchar("apikey_mngr", { length: 100 }),
    role: varchar("role", { length: 50 }),
    status: varchar("status", { length: 50 }),
    crtrId: varchar("cretr_id", { length: 100 }),
    cretDt: timestamp("cret_dt").defaultNow(),
    amdrId: varchar("amdr_id", { length: 100 }),
    amdDt: timestamp("amd_dt").defaultNow(),
    apiKeyHash: varchar("api_key_hash", { length: 255 }),
    keyNm: varchar("key_nm", { length: 100 }),
  },
  (table) => ({
    fk_api: foreignKey({ columns: [table.apiId], foreignColumns: [apiBas.apiId], name: "fk_apikey_bas_api" }),
    fk_pjt: foreignKey({ columns: [table.pjtId], foreignColumns: [pjtBas.pjtId], name: "fk_apikey_bas_pjt" }),
    apiIdIdx: index("idx_apikey_bas_api_id").on(table.apiId),
    pjtIdIdx: index("idx_apikey_bas_pjt_id").on(table.pjtId),
  })
);

export const apiUsageRealtime = pgTable(
  "api_usage_realtime",
  {
    usageId: serial("usage_id").primaryKey(),
    pjtId: integer("pjt_id"),
    apiId: integer("api_id"),
    apikeyId: integer("apikey_id"),
    modelName: varchar("model_name", { length: 100 }),
    todayRequestCount: integer("today_request_count").default(0),
    todaySuccessCount: integer("today_success_count").default(0),
    todayFailCount: integer("today_fail_count").default(0),
    todayInputTokens: integer("today_input_tokens").default(0),
    todayOutputTokens: integer("today_output_tokens").default(0),
    todayTotalTokens: integer("today_total_tokens").default(0),
    monthlyRequestCount: integer("monthly_request_count").default(0),
    monthlyTokens: integer("monthly_tokens").default(0),
    totalRequestCount: integer("total_request_count").default(0),
    totalTokens: integer("total_tokens").default(0),
    lastRequestTime: timestamp("last_request_time"),
    lastResetDate: date("last_reset_date"),
    cretDt: timestamp("cret_dt").defaultNow(),
    updtDt: timestamp("updt_dt").defaultNow(),
  },
  (table) => ({
    fk_pjt: foreignKey({ columns: [table.pjtId], foreignColumns: [pjtBas.pjtId], name: "fk_api_usage_realtime_pjt" }),
    fk_api: foreignKey({ columns: [table.apiId], foreignColumns: [apiBas.apiId], name: "fk_api_usage_realtime_api" }),
    pjtIdIdx: index("idx_api_usage_realtime_pjt_id").on(table.pjtId),
    apiIdIdx: index("idx_api_usage_realtime_api_id").on(table.apiId),
  })
);

export const apiAccessStatDaily = pgTable(
  "api_access_stat_daily",
  {
    statDate: date("stat_date").notNull(),
    apiId: integer("api_id").notNull(),
    custCd: varchar("cust_cd", { length: 50 }).notNull(),
    statusCode: varchar("status_code", { length: 10 }).notNull(),
    successCount: integer("success_count").default(0),
    failCount: integer("fail_count").default(0),
    avgLatencyMs: decimal("avg_latency_ms", { precision: 10, scale: 2 }),
    maxLatencyMs: decimal("max_latency_ms", { precision: 10, scale: 2 }),
    minLatencyMs: decimal("min_latency_ms", { precision: 10, scale: 2 }),
    lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.statDate, table.apiId, table.custCd, table.statusCode],
    }),
    fk_api: foreignKey({
      columns: [table.apiId],
      foreignColumns: [apiBas.apiId],
      name: "fk_api_access_stat_daily_api",
    }),
    apiIdIdx: index("idx_api_access_stat_daily_api_id").on(table.apiId),
    custCdIdx: index("idx_api_access_stat_daily_cust_cd").on(table.custCd),
  })
);

// ==========================================
// TYPE EXPORTS
// ==========================================
export type SysComCd = typeof sysComCd.$inferSelect;
export type InsertSysComCd = typeof sysComCd.$inferInsert;

export type MbrBas = typeof mbrBas.$inferSelect;
export type InsertMbrBas = typeof mbrBas.$inferInsert;

export type PjtBas = typeof pjtBas.$inferSelect;
export type InsertPjtBas = typeof pjtBas.$inferInsert;

export type PjtMbrAutMap = typeof pjtMbrAutMap.$inferSelect;
export type InsertPjtMbrAutMap = typeof pjtMbrAutMap.$inferInsert;

export type PjtResourceConfig = typeof pjtResourceConfig.$inferSelect;
export type InsertPjtResourceConfig = typeof pjtResourceConfig.$inferInsert;

export type MdlCatalog = typeof mdlCatalog.$inferSelect;
export type InsertMdlCatalog = typeof mdlCatalog.$inferInsert;

export type LlmBas = typeof llmBas.$inferSelect;
export type InsertLlmBas = typeof llmBas.$inferInsert;

export type LlmImage = typeof llmImage.$inferSelect;
export type InsertLlmImage = typeof llmImage.$inferInsert;

export type DpBas = typeof dpBas.$inferSelect;
export type InsertDpBas = typeof dpBas.$inferInsert;

export type ApiBas = typeof apiBas.$inferSelect;
export type InsertApiBas = typeof apiBas.$inferInsert;

export type ApiMpBas = typeof apiMpBas.$inferSelect;
export type InsertApiMpBas = typeof apiMpBas.$inferInsert;

export type ApikeyBas = typeof apikeyBas.$inferSelect;
export type InsertApikeyBas = typeof apikeyBas.$inferInsert;

export type ApiUsageRealtime = typeof apiUsageRealtime.$inferSelect;
export type InsertApiUsageRealtime = typeof apiUsageRealtime.$inferInsert;

export type ApiAccessStatDaily = typeof apiAccessStatDaily.$inferSelect;
export type InsertApiAccessStatDaily = typeof apiAccessStatDaily.$inferInsert;
