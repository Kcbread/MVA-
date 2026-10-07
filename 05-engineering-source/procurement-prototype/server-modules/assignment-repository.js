

function createAssignmentRepository({ pool }) {
  async function queryOmAssignees() {
    return pool.execute("SELECT id, employee_id, name, email, department, role FROM users WHERE role IN ('omLeader', 'omMember', 'om') AND is_active = 1 ORDER BY FIELD(role, 'omLeader', 'omMember', 'om'), name");
  }
  
  async function queryOmAssignments() {
    return pool.execute(`
        SELECT a.request_id AS requestId, a.assigned_to_user_id AS assignedToUserId, u.name AS assignedToName,
               u.email AS assignedToEmail, a.assigned_by_user_id AS assignedByUserId, b.name AS assignedByName,
               a.assigned_at AS assignedAt, a.assignment_status AS assignmentStatus, a.assignment_note AS assignmentNote
        FROM om_assignments a
        LEFT JOIN users u ON u.id = a.assigned_to_user_id
        LEFT JOIN users b ON b.id = a.assigned_by_user_id
        WHERE a.assignment_status <> 'cleared'
        ORDER BY a.assigned_at DESC
      `);
  }
  
  async function querySetOmAssignment(requestId, assignment, actor) {
    return pool.execute(
        `INSERT INTO om_assignments (request_id, assigned_to_user_id, assigned_by_user_id, assigned_at, assignment_status, assignment_note)
         VALUES (?, ?, ?, NOW(), ?, ?)
         ON DUPLICATE KEY UPDATE assigned_to_user_id = VALUES(assigned_to_user_id), assigned_by_user_id = VALUES(assigned_by_user_id),
         assigned_at = NOW(), assignment_status = VALUES(assignment_status), assignment_note = VALUES(assignment_note)`,
        [requestId, assignment.assignedToUserId, actor.id, assignment.assignmentStatus, assignment.assignmentNote],
      );
  }
  return { queryOmAssignees, queryOmAssignments, querySetOmAssignment };
}

module.exports = { createAssignmentRepository };
