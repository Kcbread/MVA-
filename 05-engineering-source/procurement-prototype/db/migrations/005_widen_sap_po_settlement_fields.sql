-- 005_widen_sap_po_settlement_fields.sql
-- Raw Data AQ/BJ can contain comma-separated settlement references that exceed 120 chars.

ALTER TABLE sap_po_raw_lines
  MODIFY COLUMN pre_settlement_no TEXT,
  MODIFY COLUMN settlement_no TEXT;

INSERT INTO schema_migrations (version, description)
VALUES ('005_widen_sap_po_settlement_fields', 'Widen SAP PO settlement reference raw mirror fields')
ON DUPLICATE KEY UPDATE description = VALUES(description);
