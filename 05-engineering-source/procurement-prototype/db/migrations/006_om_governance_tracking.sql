-- OM governance and handoff tracking persistence.
-- Apply after 005_widen_sap_po_settlement_fields.sql.

CREATE TABLE IF NOT EXISTS om_project_stage_calendar (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  year_project VARCHAR(160) NOT NULL,
  project_code VARCHAR(80) NOT NULL DEFAULT '',
  phase_code VARCHAR(40) NOT NULL,
  line_open_date DATE NOT NULL,
  updated_by_user_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_om_stage_calendar_scope (year_project, project_code, phase_code),
  INDEX idx_om_stage_calendar_project_phase (year_project, project_code, phase_code),
  INDEX idx_om_stage_calendar_updated_by (updated_by_user_id),
  CONSTRAINT fk_om_stage_calendar_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS om_procurement_tracking (
  request_id VARCHAR(96) NOT NULL PRIMARY KEY,
  budget_status VARCHAR(40),
  budget_no VARCHAR(120),
  pr_status VARCHAR(40),
  pr_no VARCHAR(120),
  po_status VARCHAR(40),
  buyer_po_no VARCHAR(120),
  pur_request_no VARCHAR(160),
  eta_plan_date DATE,
  dta_actual_date DATE,
  total_lead_time_days DECIMAL(18,4),
  updated_by_user_id VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_om_procurement_tracking_pr (pr_no),
  INDEX idx_om_procurement_tracking_po (buyer_po_no),
  INDEX idx_om_procurement_tracking_eta (eta_plan_date),
  INDEX idx_om_procurement_tracking_updated_by (updated_by_user_id),
  CONSTRAINT fk_om_procurement_tracking_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

INSERT IGNORE INTO schema_migrations (version, description)
VALUES ('006_om_governance_tracking', 'OM project stage calendar and procurement tracking persistence');
