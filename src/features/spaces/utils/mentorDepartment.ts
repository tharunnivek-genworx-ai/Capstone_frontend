/** Mentor department helpers — stored at login and refreshed via GET /mentor/me.
 *  Kept in sessionStorage so hints clear with the auth session (tab close).
 */

export interface MentorDepartment {
  departmentid: string;
  department_name?: string | null;
  department_code?: string | null;
}

/** Shapes that may carry mentor department fields (login, profile, etc.). */
export type MentorDepartmentSource = {
  departmentid?: string | null;
  department_name?: string | null;
  department_code?: string | null;
};

const STORAGE_ID = "mentor_departmentid";
const STORAGE_NAME = "mentor_department_name";
const STORAGE_CODE = "mentor_department_code";

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode / quota — degrade silently
  }
}

function removeSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function normalizeMentorDepartment(
  source: MentorDepartmentSource | null | undefined
): MentorDepartment | null {
  if (!source) return null;
  const rawId = source.departmentid;
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
  const departmentid = readSession(STORAGE_ID);
  if (!departmentid) return null;
  return {
    departmentid,
    department_name: readSession(STORAGE_NAME),
    department_code: readSession(STORAGE_CODE),
  };
}

export function storeMentorDepartment(dept: MentorDepartment): void {
  writeSession(STORAGE_ID, dept.departmentid);
  if (dept.department_name) {
    writeSession(STORAGE_NAME, dept.department_name);
  } else {
    removeSession(STORAGE_NAME);
  }
  if (dept.department_code) {
    writeSession(STORAGE_CODE, dept.department_code);
  } else {
    removeSession(STORAGE_CODE);
  }
}

export function clearMentorDepartment(): void {
  removeSession(STORAGE_ID);
  removeSession(STORAGE_NAME);
  removeSession(STORAGE_CODE);
}

export function formatDepartmentLabel(dept: MentorDepartment | null): string {
  if (!dept) return "";
  if (dept.department_name && dept.department_code) {
    return `${dept.department_name} (${dept.department_code})`;
  }
  return dept.department_name ?? dept.department_code ?? "";
}
