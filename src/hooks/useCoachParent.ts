import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import {
  COACH_CLASSES_DISCOVER,
  COACH_DASHBOARD,
  PARENT_FAMILY_UI,
} from '../constants/coachParentFlags';
import { PARENT_PILOT_ENROLLMENT } from '../constants/parentStudentFlags';
import {
  CoachClassListing,
  ParentClassEnrollment,
  StudentProfile,
} from '../types/coachParent';
import {
  listCoachClasses,
  listParentEnrollments,
  listStudentProfiles,
  shouldShowCoachToolsSection,
  shouldShowFamilySection,
  userIsCoach,
} from '../services/coachParentService';

export function useCoachParent() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [coachClasses, setCoachClasses] = useState<CoachClassListing[]>([]);
  const [enrollments, setEnrollments] = useState<ParentClassEnrollment[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user?.id) {
      setStudents([]);
      setCoachClasses([]);
      setEnrollments([]);
      return;
    }
    setLoading(true);
    try {
      const [studentRows, classRows, enrollmentRows] = await Promise.all([
        PARENT_FAMILY_UI ? listStudentProfiles(user.id) : Promise.resolve([]),
        COACH_DASHBOARD && userIsCoach(user) ? listCoachClasses(user.id) : Promise.resolve([]),
        PARENT_FAMILY_UI || PARENT_PILOT_ENROLLMENT ? listParentEnrollments(user.id) : Promise.resolve([]),
      ]);
      setStudents(studentRows);
      setCoachClasses(classRows);
      setEnrollments(enrollmentRows);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const isCoach = userIsCoach(user);
  const showFamily = shouldShowFamilySection(user?.id, students.length);
  const showCoachTools = shouldShowCoachToolsSection(user);
  const hasClassContext = enrollments.length > 0 || coachClasses.length > 0;

  return {
    loading,
    reload,
    students,
    coachClasses,
    enrollments,
    isCoach,
    showFamily,
    showCoachTools,
    hasClassContext,
    classesDiscoverEnabled: COACH_CLASSES_DISCOVER,
  };
}
