/** Mentor department helpers — stored at login and refreshed via GET /mentor/me */

export interface MentorDepartment {
  departmentid: string;
  department_name?: string | null;
  department_code?: string | null;
}

/** Shapes that may carry mentor department fields (login, profile, etc.). */
export type MentorDepartmentSource = {
  departmentid?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  department_code?: string | null;
};

const STORAGE_ID = "mentor_departmentid";
const STORAGE_NAME = "mentor_department_name";
const STORAGE_CODE = "mentor_department_code";

export function normalizeMentorDepartment(
  source: MentorDepartmentSource | null | undefined
): MentorDepartment | null {
  if (!source) return null;
  const rawId = source.departmentid ?? source.department_id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === "") {
    return null;
  }
  return {
    departmentid: String(rawId),
    department_name:
      (source.department_name as string | null | undefined) ?? null,
    department_code:
      (source.department_code as string | null | undefined) ?? null,
  };
}

export function readStoredMentorDepartment(): MentorDepartment | null {
  const departmentid = localStorage.getItem(STORAGE_ID);
  if (!departmentid) return null;
  return {
    departmentid,
    department_name: localStorage.getItem(STORAGE_NAME),
    department_code: localStorage.getItem(STORAGE_CODE),
  };
}

export function storeMentorDepartment(dept: MentorDepartment): void {
  localStorage.setItem(STORAGE_ID, dept.departmentid);
  if (dept.department_name) {
    localStorage.setItem(STORAGE_NAME, dept.department_name);
  } else {
    localStorage.removeItem(STORAGE_NAME);
  }
  if (dept.department_code) {
    localStorage.setItem(STORAGE_CODE, dept.department_code);
  } else {
    localStorage.removeItem(STORAGE_CODE);
  }
}

export function clearMentorDepartment(): void {
  localStorage.removeItem(STORAGE_ID);
  localStorage.removeItem(STORAGE_NAME);
  localStorage.removeItem(STORAGE_CODE);
}

export function formatDepartmentLabel(dept: MentorDepartment | null): string {
  if (!dept) return "";
  if (dept.department_name && dept.department_code) {
    return `${dept.department_name} (${dept.department_code})`;
  }
  return dept.department_name ?? dept.department_code ?? "";
}
