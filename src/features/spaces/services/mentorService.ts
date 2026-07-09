import axiosClient from "../../../lib/axiosClient";
import type { MentorOut } from "../../account_creation/types/account.types";
import {
  normalizeMentorDepartment,
  type MentorDepartment,
} from "../utils/mentorDepartment";

export interface TraineeOut {
  traineeid: string;
  email: string;
  fullname: string;
  employeeid: string | null;
  isactive: boolean;
}

export const mentorService = {
  /** GET /mentor/me — logged-in mentor profile with assigned department */
  async getProfile(): Promise<MentorDepartment> {
    const response = await axiosClient.get<MentorOut>("/mentor/me");
    const dept = normalizeMentorDepartment(response.data);
    if (!dept) {
      throw new Error("Mentor profile is missing department information.");
    }
    return dept;
  },

  async searchTrainees(query: string, limit = 20): Promise<TraineeOut[]> {
    const response = await axiosClient.get<TraineeOut[]>("/mentor/trainees/search", {
      params: { q: query, limit },
    });
    return response.data;
  },
};
