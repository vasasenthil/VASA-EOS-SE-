'use server';

import { getSession, requireRole } from '@/lib/auth/session';
import { getTenantContext } from '@/lib/auth/tenant-scoper';
import { getTeacherAttendanceSummary } from '@/lib/attendance/store';
import { getTeacherAssignments } from '@/lib/assignments/store';
import { getTeacherTimetable } from '@/lib/timetable-manager/store';
import { getFlaggedStudentsForTeacher } from '@/lib/earlywarning/store';
import { getNoticesForTeacher } from '@/lib/notices/store';

export interface TeacherDashboardData {
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    percentage: number;
  };
  assignments: {
    pending: number;
    graded: number;
    overdue: number;
  };
  timetable: Array<{
    period: number;
    subject: string;
    class: string;
    room: string;
    startTime: string;
    endTime: string;
  }>;
  flaggedStudents: Array<{
    studentId: string;
    studentName: string;
    riskScore: number;
    reason: string;
  }>;
  notices: Array<{
    id: string;
    title: string;
    date: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const session = await requireRole('TEACHER');
  const tenant = await getTenantContext();
  const teacherId = session.user.id;
  const schoolId = tenant.schoolId;
  const today = new Date();

  try {
    const [attendance, assignments, timetable, flaggedStudents, notices] = await Promise.all([
      getTeacherAttendanceSummary(teacherId, schoolId ?? "", today),
      getTeacherAssignments(teacherId, schoolId),
      getTeacherTimetable(teacherId, schoolId, today),
      getFlaggedStudentsForTeacher(teacherId, schoolId),
      getNoticesForTeacher(teacherId, schoolId)
    ]);

    return {
      attendance,
      assignments,
      timetable,
      flaggedStudents,
      notices
    };
  } catch (error) {
    console.error('Failed to load teacher dashboard data:', error);
    throw new Error('Failed to load dashboard data. Please try again.');
  }
}
