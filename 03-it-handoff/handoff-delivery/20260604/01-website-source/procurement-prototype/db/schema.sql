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
