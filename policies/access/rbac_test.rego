package vasa.access.rbac_test
import rego.v1
import data.vasa.access.rbac

test_teacher_can_write_marks if {
	rbac.allow with input as {"subject": {"role": "TEACHER"}, "action": "marks.write"}
}
test_student_cannot_write_marks if {
	not rbac.allow with input as {"subject": {"role": "STUDENT"}, "action": "marks.write"}
}
test_auditor_can_read_audit if {
	rbac.allow with input as {"subject": {"role": "AUDITOR"}, "action": "audit.read"}
}
