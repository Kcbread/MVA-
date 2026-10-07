-- Add OM/MFG buy scope metadata to SAP PO Raw Data mirror rows.
-- Existing UAT databases that already applied 002 can apply this migration in place.

SET @schema_name := DATABASE();

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE sap_po_raw_lines ADD COLUMN buy_scope VARCHAR(40) NOT NULL DEFAULT ''mfg_buy'' AFTER material_id',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'sap_po_raw_lines' AND column_name = 'buy_scope'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE sap_po_raw_lines ADD COLUMN scope_source VARCHAR(80) NOT NULL DEFAULT ''default_non_yellow'' AFTER buy_scope',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'sap_po_raw_lines' AND column_name = 'scope_source'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE sap_po_raw_lines ADD COLUMN source_fill_color VARCHAR(40) AFTER scope_source',
    'SELECT 1')
  FROM information_schema.columns
  WHERE table_schema = @schema_name AND table_name = 'sap_po_raw_lines' AND column_name = 'source_fill_color'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @ddl := (
  SELECT IF(COUNT(*) = 0,
    'CREATE INDEX idx_sap_po_raw_scope ON sap_po_raw_lines (buy_scope, scope_source)',
    'SELECT 1')
  FROM information_schema.statistics
  WHERE table_schema = @schema_name AND table_name = 'sap_po_raw_lines' AND index_name = 'idx_sap_po_raw_scope'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO schema_migrations (version, description)
VALUES ('003_sap_po_raw_scope', 'Add OM/MFG buy scope fields to SAP PO raw lines')
ON DUPLICATE KEY UPDATE description = VALUES(description);
