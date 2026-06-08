// src/features/account_creation/services/accountService.ts
/**
 * Account API service — all calls against /admin/mentors and /admin/trainees endpoints.
 * Requires itadmin JWT, automatically attached via axiosClient interceptor.
 */

import axiosClient from "../../../lib/axiosClient";
import type {
  MentorCreate,
  MentorDeactivateRequest,
  MentorListResponse,
  MentorOut,
  MentorReactivateRequest,
  TraineeCreate,
  TraineeDeactivateRequest,
  TraineeListResponse,
  TraineeOut,
  TraineeReactivateRequest,
} from "../types/account.types";

// ─── Mentor operations ─────────────────────────────────────────────────────

export const accountService = {
  // --- Mentors ---

  /** POST /admin/mentors */
  async createMentor(payload: MentorCreate): Promise<MentorOut> {
    const response = await axiosClient.post<MentorOut>("/admin/mentors", payload);
    return response.data;
  },

  /** GET /admin/mentors?page=1&limit=20 */
  async listMentors(page = 1, limit = 20): Promise<MentorListResponse> {
    const response = await axiosClient.get<MentorListResponse>("/admin/mentors", {
      params: { page, limit },
    });
    return response.data;
  },

  /** GET /admin/mentors/:id */
  async getMentor(mentorId: string): Promise<MentorOut> {
    const response = await axiosClient.get<MentorOut>(`/admin/mentors/${mentorId}`);
    return response.data;
  },

  /** PATCH /admin/mentors/:id/deactivate */
  async deactivateMentor(
    mentorId: string,
    payload: MentorDeactivateRequest
  ): Promise<MentorOut> {
    const response = await axiosClient.patch<MentorOut>(
      `/admin/mentors/${mentorId}/deactivate`,
      payload
    );
    return response.data;
  },

  /** PATCH /admin/mentors/:id/reactivate */
  async reactivateMentor(
    mentorId: string,
    payload: MentorReactivateRequest
  ): Promise<MentorOut> {
    const response = await axiosClient.patch<MentorOut>(
      `/admin/mentors/${mentorId}/reactivate`,
      payload
    );
    return response.data;
  },

  // --- Trainees ---

  /** POST /admin/trainees */
  async createTrainee(payload: TraineeCreate): Promise<TraineeOut> {
    const response = await axiosClient.post<TraineeOut>("/admin/trainees", payload);
    return response.data;
  },

  /** GET /admin/trainees?page=1&limit=20 */
  async listTrainees(page = 1, limit = 20): Promise<TraineeListResponse> {
    const response = await axiosClient.get<TraineeListResponse>("/admin/trainees", {
      params: { page, limit },
    });
    return response.data;
  },

  /** GET /admin/trainees/:id */
  async getTrainee(traineeId: string): Promise<TraineeOut> {
    const response = await axiosClient.get<TraineeOut>(`/admin/trainees/${traineeId}`);
    return response.data;
  },

  /** PATCH /admin/trainees/:id/deactivate */
  async deactivateTrainee(
    traineeId: string,
    payload: TraineeDeactivateRequest
  ): Promise<TraineeOut> {
    const response = await axiosClient.patch<TraineeOut>(
      `/admin/trainees/${traineeId}/deactivate`,
      payload
    );
    return response.data;
  },

  /** PATCH /admin/trainees/:id/reactivate */
  async reactivateTrainee(
    traineeId: string,
    payload: TraineeReactivateRequest
  ): Promise<TraineeOut> {
    const response = await axiosClient.patch<TraineeOut>(
      `/admin/trainees/${traineeId}/reactivate`,
      payload
    );
    return response.data;
  },
};
