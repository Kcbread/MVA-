INSERT INTO users (id, employee_id, name, email, department, role, project_family, project_codes, responsibility_department, password_hash, is_active)
VALUES
  ('om-leader-mai', 'maint5', 'Mai', 'maint5@fih-foxconn.com', 'Operations', 'omLeader', 'Mixed', 'All OM', 'OM Purchasing', 'plain:123', 1),
  ('om-member-giang', 'giangth1', 'Giang', 'giangth1@fih-foxconn.com', 'Operations', 'omMember', 'Mixed', 'Assigned OM rows', 'OM Purchasing', 'plain:123', 1),
  ('om-member-linh', 'linhnp', 'Linh', 'linhnp@fih-foxconn.com', 'Operations', 'omMember', 'Mixed', 'Assigned OM rows', 'OM Purchasing', 'plain:123', 1),
  ('admin-default', 'admin', 'Admin', 'admin@fih-foxconn.com', 'IT', 'admin', 'Mixed', 'All', 'System Admin', 'plain:123', 1),
  ('cost-owner', 'cost-owner', 'Cost Owner', 'cost-owner@fih-foxconn.com', 'MFG', 'manager', 'Mixed', 'All cost scope', 'Cost Owner', 'plain:123', 1),
  ('requester-v1524505', 'V1524505', 'To Thi Phuong Anh', 'anhttp@fih-foxconn.com', 'MFG', 'requester', 'G', 'P26 Demo Line,P26,P27', 'MFG', 'plain:123', 1),
  ('requester-v1547168', 'V1547168', 'Dang Thi Ban', 'bandt1@fih-foxconn.com', 'MFG', 'requester', 'Non-G', 'LD8,MH2,BM2,SSF,ML2,MA4', 'MFG', 'plain:123', 1),
  ('dept-dri-default', 'dept-dri', 'Dept DRI', 'dept-dri@fih-foxconn.com', 'MFG', 'dri', 'Mixed', 'Escalation scope', 'Dept DRI', 'plain:123', 1),
  ('budget-approver-default', 'budget-approver', 'Budget Approver', 'budget-approver@fih-foxconn.com', 'PMO', 'projectDri', 'Mixed', 'Budget approval scope', 'Budget Approver', 'plain:123', 1),
  ('uat-requester', 'requester', 'Requester Tester', 'requester@uat.local', 'MFG', 'requester', 'Mixed', 'P26 Demo Line,P26,P27', 'MFG', 'plain:123', 1),
  ('uat-deptdri', 'deptdri', 'Dept DRI Tester', 'deptdri@uat.local', 'MFG', 'dri', 'Mixed', 'Escalation scope', 'Dept DRI', 'plain:123', 1),
  ('uat-omleader', 'omleader', 'OM Leader Tester', 'omleader@uat.local', 'Operations', 'omLeader', 'Mixed', 'All OM', 'OM Purchasing', 'plain:123', 1),
  ('uat-ompurchasing', 'ompurchasing', 'OM Purchasing Tester', 'ompurchasing@uat.local', 'Operations', 'omMember', 'Mixed', 'Assigned OM rows', 'OM Purchasing', 'plain:123', 1),
  ('uat-admin', 'admin-uat', 'Admin Tester', 'admin.uat@uat.local', 'IT', 'admin', 'Mixed', 'All', 'System Admin', 'plain:123', 1)
ON DUPLICATE KEY UPDATE
  employee_id = VALUES(employee_id),
  name = VALUES(name),
  department = VALUES(department),
  role = VALUES(role),
  project_family = VALUES(project_family),
  project_codes = VALUES(project_codes),
  responsibility_department = VALUES(responsibility_department),
  password_hash = VALUES(password_hash),
  is_active = VALUES(is_active);
