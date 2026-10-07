-- Canonical Lv123 taxonomy and Factory Material No coding governance.
-- Keeps Requester-visible Lv123 separate from internal Factory/PK/SAP/FTV identity.

SET @schema_name := DATABASE();

CREATE TABLE IF NOT EXISTS lv_taxonomy (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  lv1 VARCHAR(120) NOT NULL,
  lv2 VARCHAR(120) NOT NULL,
  lv3 VARCHAR(120) NOT NULL,
  source_file_name VARCHAR(255),
  source_sheet_name VARCHAR(120),
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lv_taxonomy_path (lv1, lv2, lv3),
  INDEX idx_lv_taxonomy_lv1_lv2 (lv1, lv2),
  INDEX idx_lv_taxonomy_status (status)
);

CREATE TABLE IF NOT EXISTS material_coding_rules (
  id VARCHAR(96) PRIMARY KEY,
  lv1 VARCHAR(120) NOT NULL,
  lv2 VARCHAR(120) NOT NULL,
  lv3 VARCHAR(120),
  lv1_code VARCHAR(40),
  lv2_code VARCHAR(40),
  prefix VARCHAR(40) NOT NULL,
  rule_type VARCHAR(40) NOT NULL DEFAULT 'lv2_prefix',
  source_file_name VARCHAR(255),
  source_sheet_name VARCHAR(120),
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_material_coding_rule_scope (lv1, lv2, lv3, prefix),
  INDEX idx_material_coding_prefix (prefix),
  INDEX idx_material_coding_status (status)
);

CREATE TABLE IF NOT EXISTS factory_material_sequences (
  prefix VARCHAR(40) PRIMARY KEY,
  current_sequence INT NOT NULL DEFAULT 0,
  updated_by_user_id VARCHAR(64),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_factory_seq_user FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE item_master ADD COLUMN lv1 VARCHAR(120) AFTER spec',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'item_master' AND column_name = 'lv1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE item_master ADD COLUMN lv2 VARCHAR(120) AFTER lv1',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'item_master' AND column_name = 'lv2'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE item_master ADD COLUMN lv3 VARCHAR(120) AFTER lv2',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'item_master' AND column_name = 'lv3'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_item_master_lv123 ON item_master (lv1, lv2, lv3)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = @schema_name AND table_name = 'item_master' AND index_name = 'idx_item_master_lv123'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE material_identity ADD COLUMN material_coding_review_status VARCHAR(80) NOT NULL DEFAULT ''Approved mapping'' AFTER status',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'material_identity' AND column_name = 'material_coding_review_status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE material_identity ADD COLUMN generated_by_rule_id VARCHAR(96) AFTER material_coding_review_status',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'material_identity' AND column_name = 'generated_by_rule_id'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE material_identity ADD COLUMN source_row_number INT AFTER generated_by_rule_id',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'material_identity' AND column_name = 'source_row_number'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE material_identity ADD COLUMN source_type VARCHAR(80) AFTER source_row_number',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'material_identity' AND column_name = 'source_type'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_material_identity_coding_status ON material_identity (material_coding_review_status)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = @schema_name AND table_name = 'material_identity' AND index_name = 'idx_material_identity_coding_status'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO schema_migrations (version, description)
VALUES ('004_lv123_material_coding', 'Add canonical Lv123 taxonomy and Factory Material No coding governance')
ON DUPLICATE KEY UPDATE description = VALUES(description);
