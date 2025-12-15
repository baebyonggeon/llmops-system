-- LLMOps System PostgreSQL Schema Initialization

-- 1. Common Code Table
CREATE TABLE IF NOT EXISTS sys_com_cd (
  lcff_cd VARCHAR(50) NOT NULL,
  sclff_cd VARCHAR(50) NOT NULL,
  lcff_nm VARCHAR(200),
  sclff_nm VARCHAR(200),
  PRIMARY KEY (lcff_cd, sclff_cd)
);

-- 2. Member Domain
CREATE TABLE IF NOT EXISTS mbr_bas (
  mbr_id SERIAL PRIMARY KEY,
  cust_cd VARCHAR(50),
  mbr_type_cd VARCHAR(50),
  id VARCHAR(100) UNIQUE,
  mbr_nm VARCHAR(200),
  pwd VARCHAR(255),
  mbr_uuid VARCHAR(100) UNIQUE,
  mbr_sttus_cd VARCHAR(50),
  mbr_class_id VARCHAR(50),
  phone_number VARCHAR(20),
  email_athn VARCHAR(100),
  tmp_pwd_iss_yn VARCHAR(1) DEFAULT 'N',
  use_yn VARCHAR(1) DEFAULT 'Y',
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mbr_bas_cust_cd ON mbr_bas(cust_cd);
CREATE INDEX idx_mbr_bas_mbr_uuid ON mbr_bas(mbr_uuid);

-- 3. Project Domain
CREATE TABLE IF NOT EXISTS pjt_bas (
  pjt_id SERIAL,
  cust_cd VARCHAR(50) NOT NULL,
  pjt_nm VARCHAR(200),
  pjt_dscrt TEXT,
  del_yn VARCHAR(1) DEFAULT 'N',
  use_yn VARCHAR(1) DEFAULT 'Y',
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  state_cd VARCHAR(50),
  pjt_uuid VARCHAR(100) UNIQUE,
  reason TEXT,
  PRIMARY KEY (pjt_id, cust_cd)
);

CREATE INDEX idx_pjt_bas_cust_cd ON pjt_bas(cust_cd);
CREATE INDEX idx_pjt_bas_pjt_uuid ON pjt_bas(pjt_uuid);

CREATE TABLE IF NOT EXISTS pjt_mbr_aut_map (
  id SERIAL PRIMARY KEY,
  pjt_id INTEGER NOT NULL,
  cust_cd VARCHAR(50) NOT NULL,
  mbr_uuid VARCHAR(100) NOT NULL,
  fav_yn VARCHAR(1) DEFAULT 'N',
  auth VARCHAR(50),
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  mbr_type_cd VARCHAR(50),
  FOREIGN KEY (pjt_id, cust_cd) REFERENCES pjt_bas(pjt_id, cust_cd)
);

CREATE INDEX idx_pjt_mbr_aut_pjt_id ON pjt_mbr_aut_map(pjt_id);
CREATE INDEX idx_pjt_mbr_aut_mbr_uuid ON pjt_mbr_aut_map(mbr_uuid);

CREATE TABLE IF NOT EXISTS pjt_resource_config (
  pjt_id INTEGER PRIMARY KEY,
  pjt_uuid VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  domain VARCHAR(255),
  resource_policy TEXT,
  allowed_resource_groups TEXT,
  allowed_folder_hosts TEXT,
  max_allowed_cpu INTEGER,
  max_allowed_memory INTEGER,
  container_registry VARCHAR(255),
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  cust_cc VARCHAR(50),
  FOREIGN KEY (pjt_id) REFERENCES pjt_bas(pjt_id)
);

-- 4. Model / Image / Deploy Domain
CREATE TABLE IF NOT EXISTS llm_bas (
  llm_id SERIAL PRIMARY KEY,
  llm_nnr VARCHAR(100),
  llm_type VARCHAR(50),
  llm_ver VARCHAR(50),
  llm_dscrt TEXT,
  llm_dtl TEXT,
  dp_inst_cnt INTEGER,
  dp_inst_dscrt TEXT,
  store_type VARCHAR(50),
  store_url VARCHAR(255),
  store_usr VARCHAR(100),
  store_pwd VARCHAR(255),
  mdl_type VARCHAR(50),
  mdl_size VARCHAR(50),
  mdl_strtg VARCHAR(50),
  pub_yn VARCHAR(1) DEFAULT 'N',
  del_yn VARCHAR(1) DEFAULT 'N',
  use_yn VARCHAR(1) DEFAULT 'Y',
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  strm_yn VARCHAR(1) DEFAULT 'N',
  context_window_length INTEGER,
  embedding_yn VARCHAR(1) DEFAULT 'N',
  evl_yn VARCHAR(1) DEFAULT 'N',
  holder_yn VARCHAR(1) DEFAULT 'N',
  llm_param TEXT
);

CREATE INDEX idx_llm_bas_llm_nnr ON llm_bas(llm_nnr);

CREATE TABLE IF NOT EXISTS mdl_catalog (
  llm_id INTEGER NOT NULL,
  mdl_ctgry_cd VARCHAR(50) NOT NULL,
  provider VARCHAR(100),
  dscrt TEXT,
  mdl_link VARCHAR(255),
  dp_yn VARCHAR(1) DEFAULT 'N',
  use_yn VARCHAR(1) DEFAULT 'Y',
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (llm_id, mdl_ctgry_cd)
);

CREATE TABLE IF NOT EXISTS llm_image (
  image_id SERIAL PRIMARY KEY,
  image_dscrt TEXT,
  tag VARCHAR(100),
  image_save_file_nm VARCHAR(255),
  image_file_ext VARCHAR(20),
  image_file_size INTEGER,
  image_file_url VARCHAR(255),
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  image_real_file_nm VARCHAR(255)
);

CREATE INDEX idx_llm_image_tag ON llm_image(tag);

CREATE TABLE IF NOT EXISTS dp_bas (
  dp_id SERIAL PRIMARY KEY,
  cust_cd VARCHAR(50) NOT NULL,
  pjt_id INTEGER,
  llm_id INTEGER,
  ft_id INTEGER,
  apdpl_ids TEXT,
  data_set_id INTEGER,
  inst_cnt INTEGER,
  dp_sttus VARCHAR(50),
  del_yn VARCHAR(1) DEFAULT 'N',
  use_yn VARCHAR(1) DEFAULT 'Y',
  dp_yn VARCHAR(1) DEFAULT 'N',
  strm_yn VARCHAR(1) DEFAULT 'N',
  prompt TEXT,
  dp_dns_dt TIMESTAMP,
  cnvsr VARCHAR(100),
  cmpl VARCHAR(100),
  cont_fltr TEXT,
  cont_fltr_id INTEGER,
  last_dp_id INTEGER,
  last_dp_usr VARCHAR(100),
  dp_grp_code VARCHAR(50),
  dp_version VARCHAR(50),
  dp_prev_dp_id INTEGER,
  service_id INTEGER,
  deploy_param TEXT,
  api_id INTEGER,
  run_sttus VARCHAR(50),
  svc_nnr VARCHAR(100),
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dp_bas_cust_cd ON dp_bas(cust_cd);
CREATE INDEX idx_dp_bas_dp_sttus ON dp_bas(dp_sttus);

-- 5. API / USAGE / KEY / STATS Domain
CREATE TABLE IF NOT EXISTS api_bas (
  api_id SERIAL PRIMARY KEY,
  pjt_id INTEGER,
  api_nm VARCHAR(200),
  api_dscrt TEXT,
  api_endpoint VARCHAR(255),
  api_mthd VARCHAR(50),
  api_vrsn VARCHAR(50),
  use_yn VARCHAR(1) DEFAULT 'Y',
  del_yn VARCHAR(1) DEFAULT 'N',
  status VARCHAR(50),
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_bas_pjt_id ON api_bas(pjt_id);

CREATE TABLE IF NOT EXISTS api_mp_bas (
  api_mp_id SERIAL PRIMARY KEY,
  api_id INTEGER NOT NULL,
  dp_id INTEGER,
  api_mp_dscrt TEXT,
  use_yn VARCHAR(1) DEFAULT 'Y',
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (api_id) REFERENCES api_bas(api_id)
);

CREATE INDEX idx_api_mp_bas_api_id ON api_mp_bas(api_id);

CREATE TABLE IF NOT EXISTS apikey_bas (
  apikey_id SERIAL PRIMARY KEY,
  api_id INTEGER NOT NULL,
  pjt_id INTEGER,
  apikey VARCHAR(255) UNIQUE,
  apikey_nm VARCHAR(200),
  use_yn VARCHAR(1) DEFAULT 'Y',
  del_yn VARCHAR(1) DEFAULT 'N',
  exp_dt TIMESTAMP,
  rate_limit INTEGER,
  cretr_id VARCHAR(100),
  cret_dt TIMESTAMP DEFAULT NOW(),
  amdr_id VARCHAR(100),
  amd_dt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (api_id) REFERENCES api_bas(api_id)
);

CREATE INDEX idx_apikey_bas_api_id ON apikey_bas(api_id);
CREATE INDEX idx_apikey_bas_pjt_id ON apikey_bas(pjt_id);

CREATE TABLE IF NOT EXISTS api_usage_realtime (
  api_usage_id SERIAL PRIMARY KEY,
  pjt_id INTEGER,
  api_id INTEGER NOT NULL,
  cust_cd VARCHAR(50),
  req_cnt INTEGER DEFAULT 0,
  res_cnt INTEGER DEFAULT 0,
  err_cnt INTEGER DEFAULT 0,
  updt_dt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (api_id) REFERENCES api_bas(api_id)
);

CREATE INDEX idx_api_usage_realtime_pjt_id ON api_usage_realtime(pjt_id);
CREATE INDEX idx_api_usage_realtime_api_id ON api_usage_realtime(api_id);

CREATE TABLE IF NOT EXISTS api_access_stat_daily (
  stat_date DATE NOT NULL,
  api_id INTEGER NOT NULL,
  cust_cd VARCHAR(50) NOT NULL,
  status_code VARCHAR(10) NOT NULL,
  req_cnt INTEGER DEFAULT 0,
  res_cnt INTEGER DEFAULT 0,
  err_cnt INTEGER DEFAULT 0,
  PRIMARY KEY (stat_date, api_id, cust_cd, status_code),
  FOREIGN KEY (api_id) REFERENCES api_bas(api_id)
);

CREATE INDEX idx_api_access_stat_daily_api_id ON api_access_stat_daily(api_id);
CREATE INDEX idx_api_access_stat_daily_cust_cd ON api_access_stat_daily(cust_cd);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  notif_id SERIAL PRIMARY KEY,
  mbr_id INTEGER NOT NULL,
  title VARCHAR(200),
  content TEXT,
  notif_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  cret_dt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (mbr_id) REFERENCES mbr_bas(mbr_id)
);

CREATE INDEX idx_notifications_mbr_id ON notifications(mbr_id);

-- 7. Alert Conditions
CREATE TABLE IF NOT EXISTS alert_conditions (
  alert_id SERIAL PRIMARY KEY,
  mbr_id INTEGER NOT NULL,
  condition_type VARCHAR(50),
  threshold DECIMAL(10, 4),
  operator VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  cret_dt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (mbr_id) REFERENCES mbr_bas(mbr_id)
);

CREATE INDEX idx_alert_conditions_mbr_id ON alert_conditions(mbr_id);
