CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  employee_id VARCHAR(64) UNIQUE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  department VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  project_family VARCHAR(40),
  project_codes VARCHAR(500),
  responsibility_department VARCHAR(120),
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(96) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  INDEX idx_sessions_token_hash (token_hash),
  INDEX idx_sessions_user_id (user_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS om_assignments (
  request_id VARCHAR(96) PRIMARY KEY,
  assigned_to_user_id VARCHAR(64) NULL,
  assigned_by_user_id VARCHAR(64) NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assignment_status VARCHAR(32) NOT NULL DEFAULT 'assigned',
  assignment_note VARCHAR(500),
  CONSTRAINT fk_om_assign_to FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  CONSTRAINT fk_om_assign_by FOREIGN KEY (assigned_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS uat_feedback (
  id VARCHAR(96) PRIMARY KEY,
  submitted_by_user_id VARCHAR(64) NOT NULL,
  page_key VARCHAR(120) NOT NULL,
  row_scope_type VARCHAR(80),
  row_scope_id VARCHAR(120),
  row_scope_label VARCHAR(240),
  category VARCHAR(80) NOT NULL DEFAULT 'general',
  severity VARCHAR(40) NOT NULL DEFAULT 'medium',
  feedback_text TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  owner_user_id VARCHAR(64) NULL,
  metadata_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uat_feedback_submitter (submitted_by_user_id),
  INDEX idx_uat_feedback_status (status),
  INDEX idx_uat_feedback_owner (owner_user_id),
  INDEX idx_uat_feedback_page_row (page_key, row_scope_type, row_scope_id),
  CONSTRAINT fk_uat_feedback_submitter FOREIGN KEY (submitted_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_uat_feedback_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(96) PRIMARY KEY,
  linked_entity_type VARCHAR(80) NOT NULL,
  linked_entity_id VARCHAR(120) NOT NULL,
  attachment_kind VARCHAR(80) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120),
  file_size BIGINT NOT NULL DEFAULT 0,
  uploaded_by_user_id VARCHAR(64) NOT NULL,
  uploaded_by_role VARCHAR(40),
  visibility_scope VARCHAR(80) NOT NULL DEFAULT 'om_internal',
  metadata_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attachments_entity (linked_entity_type, linked_entity_id),
  INDEX idx_attachments_uploader (uploaded_by_user_id),
  INDEX idx_attachments_kind (attachment_kind),
  CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_type VARCHAR(80) NOT NULL,
  actor_user_id VARCHAR(64),
  actor_role VARCHAR(40),
  entity_type VARCHAR(60),
  entity_id VARCHAR(96),
  metadata_json JSON,
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_type (event_type)
);

CREATE TABLE IF NOT EXISTS item_master (
  id VARCHAR(96) PRIMARY KEY,
  normalized_item_key VARCHAR(255) NOT NULL UNIQUE,
  eng_name VARCHAR(240) NOT NULL,
  cn_eng_name VARCHAR(240),
  vn_name VARCHAR(240),
  spec TEXT,
  category VARCHAR(120),
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_master_requests (
  id VARCHAR(96) PRIMARY KEY,
  request_item_id VARCHAR(96),
  proposed_normalized_item_key VARCHAR(255) NOT NULL,
  proposed_eng_name VARCHAR(240) NOT NULL,
  proposed_cn_eng_name VARCHAR(240) NOT NULL,
  proposed_vn_name VARCHAR(240) NOT NULL,
  proposed_spec TEXT NOT NULL,
  structured_spec_json JSON,
  proposed_category VARCHAR(120) NOT NULL,
  proposed_uom VARCHAR(40) NOT NULL,
  requester_reason VARCHAR(1000) NOT NULL,
  estimate_currency VARCHAR(3) NOT NULL,
  estimate_unit_price DECIMAL(18,4) NOT NULL,
  estimate_reason VARCHAR(1000) NOT NULL,
  duplicate_candidates_json JSON,
  duplicate_difference VARCHAR(1000),
  evidence_reference VARCHAR(1000),
  status VARCHAR(40) NOT NULL DEFAULT 'pending_dept_dri_review',
  dept_dri_decision VARCHAR(40),
  master_review_decision VARCHAR(40),
  approved_item_id VARCHAR(96),
  merged_item_id VARCHAR(96),
  decided_by_user_id VARCHAR(64),
  decided_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_item_master_requests_key (proposed_normalized_item_key),
  INDEX idx_item_master_requests_status (status),
  INDEX idx_item_master_requests_request_item (request_item_id),
  CONSTRAINT fk_item_master_requests_approved_item FOREIGN KEY (approved_item_id) REFERENCES item_master(id),
  CONSTRAINT fk_item_master_requests_merged_item FOREIGN KEY (merged_item_id) REFERENCES item_master(id)
);

CREATE TABLE IF NOT EXISTS material_identity (
  id VARCHAR(96) PRIMARY KEY,
  item_id VARCHAR(96) NOT NULL,
  material_no VARCHAR(120) NOT NULL,
  material_no_type VARCHAR(40) NOT NULL,
  created_from VARCHAR(80),
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_material_no (material_no),
  INDEX idx_material_identity_item (item_id),
  CONSTRAINT fk_material_identity_item FOREIGN KEY (item_id) REFERENCES item_master(id)
);

CREATE TABLE IF NOT EXISTS purchase_route_decisions (
  request_line_id VARCHAR(96) PRIMARY KEY,
  item_id VARCHAR(96),
  material_id VARCHAR(96),
  route_type VARCHAR(40) NOT NULL,
  quote_owner VARCHAR(40) NOT NULL,
  confirmed_by_user_id VARCHAR(64),
  confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reason VARCHAR(500),
  INDEX idx_purchase_route_item (item_id),
  INDEX idx_purchase_route_material (material_id),
  INDEX idx_purchase_route_owner (quote_owner),
  CONSTRAINT fk_purchase_route_item FOREIGN KEY (item_id) REFERENCES item_master(id),
  CONSTRAINT fk_purchase_route_material FOREIGN KEY (material_id) REFERENCES material_identity(id),
  CONSTRAINT fk_purchase_route_user FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ftv_code_master (
  id VARCHAR(96) PRIMARY KEY,
  item_id VARCHAR(96) NOT NULL,
  material_id VARCHAR(96),
  demand_department VARCHAR(120) NOT NULL,
  ftv_code VARCHAR(120) NOT NULL,
  factory_code VARCHAR(40),
  type_code VARCHAR(40),
  dept_code VARCHAR(40),
  sequence_no INT,
  active_scope_key VARCHAR(32) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  effective_from DATE,
  eol_at DATE,
  created_by_user_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ftv_code (ftv_code),
  UNIQUE KEY uq_ftv_item_department_active (item_id, demand_department, active_scope_key),
  INDEX idx_ftv_material (material_id),
  INDEX idx_ftv_department (demand_department),
  CONSTRAINT fk_ftv_item FOREIGN KEY (item_id) REFERENCES item_master(id),
  CONSTRAINT fk_ftv_material FOREIGN KEY (material_id) REFERENCES material_identity(id),
  CONSTRAINT fk_ftv_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ftv_mapping_staging (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  legacy_item_name VARCHAR(240),
  legacy_spec TEXT,
  legacy_department VARCHAR(120),
  legacy_ftv_code VARCHAR(120),
  legacy_po_no VARCHAR(120),
  matched_item_id VARCHAR(96),
  matched_material_id VARCHAR(96),
  match_status VARCHAR(40) NOT NULL DEFAULT 'pending_review',
  reviewed_by_user_id VARCHAR(64),
  reviewed_at TIMESTAMP NULL,
  metadata_json JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ftv_staging_code (legacy_ftv_code),
  INDEX idx_ftv_staging_match (matched_item_id, legacy_department),
  CONSTRAINT fk_ftv_staging_item FOREIGN KEY (matched_item_id) REFERENCES item_master(id),
  CONSTRAINT fk_ftv_staging_material FOREIGN KEY (matched_material_id) REFERENCES material_identity(id),
  CONSTRAINT fk_ftv_staging_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS customs_audit_records (
  id VARCHAR(96) PRIMARY KEY,
  export_id VARCHAR(96) NOT NULL,
  request_line_id VARCHAR(96) NOT NULL,
  item_id VARCHAR(96) NOT NULL,
  material_id VARCHAR(96),
  demand_department VARCHAR(120) NOT NULL,
  purchase_route VARCHAR(40) NOT NULL,
  ftv_code VARCHAR(120),
  ftv_status VARCHAR(40) NOT NULL,
  quote_file_ref VARCHAR(255),
  export_package_code VARCHAR(160),
  metadata_json JSON,
  exported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customs_export (export_id),
  INDEX idx_customs_item_department (item_id, demand_department),
  INDEX idx_customs_request_line (request_line_id),
  CONSTRAINT fk_customs_item FOREIGN KEY (item_id) REFERENCES item_master(id),
  CONSTRAINT fk_customs_material FOREIGN KEY (material_id) REFERENCES material_identity(id)
);
