// src/features/spaces/services/spaceService.ts
/**
 * Space API service — all calls against /spaces/* endpoints.
 * Requires mentor JWT, automatically attached via axiosClient interceptor.
 * Reference: src/api/rest/routes/space_node_routes/space_route.py
 */

import axiosClient from "../../../lib/axiosClient";
import type {
  SpaceCreateRequest,
  SpaceUpdateRequest,
  SpacePublishRequest,
  SpaceTransferOwnershipRequest,
  SpaceAddTraineesRequest,
  SpaceRemoveTraineeRequest,
  SpaceJoinRequest,
  SpaceResponse,
  SpaceListResponse,
  SpaceJoinResponse,
  SpaceMemberSummary,
} from "../types/space.types";

export const spaceService = {
  /**
   * POST /spaces
   * Mentor creates a new e-learning space. Invite code is auto-generated.
   */
  async createSpace(payload: SpaceCreateRequest): Promise<SpaceResponse> {
    const response = await axiosClient.post<SpaceResponse>("/spaces", payload);
    return response.data;
  },

  /**
   * GET /spaces?page=1&limit=20
   * Returns all spaces where caller is owner (mentor) or member (trainee).
   */
  async listSpaces(page = 1, limit = 20): Promise<SpaceListResponse> {
    const response = await axiosClient.get<SpaceListResponse>("/spaces", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * GET /spaces/:spaceId
   * Fetch a single space by ID.
   */
  async getSpace(spaceId: string): Promise<SpaceResponse> {
    const response = await axiosClient.get<SpaceResponse>(`/spaces/${spaceId}`);
    return response.data;
  },

  /**
   * PATCH /spaces/:spaceId
   * Partial update of space metadata (name, description).
   */
  async updateSpace(spaceId: string, payload: SpaceUpdateRequest): Promise<SpaceResponse> {
    const response = await axiosClient.patch<SpaceResponse>(
      `/spaces/${spaceId}`,
      payload
    );
    return response.data;
  },

  /**
   * PATCH /spaces/:spaceId/publish
   * Publish or unpublish a space.
   */
  async publishSpace(spaceId: string, payload: SpacePublishRequest): Promise<SpaceResponse> {
    const response = await axiosClient.patch<SpaceResponse>(
      `/spaces/${spaceId}/publish`,
      payload
    );
    return response.data;
  },

  /**
   * PATCH /spaces/:spaceId/transfer-ownership
   * ITAdmin transfers ownership to another mentor (EC-27).
   */
  async transferOwnership(
    spaceId: string,
    payload: SpaceTransferOwnershipRequest
  ): Promise<SpaceResponse> {
    const response = await axiosClient.patch<SpaceResponse>(
      `/spaces/${spaceId}/transfer-ownership`,
      payload
    );
    return response.data;
  },

  /**
   * GET /spaces/:spaceId/trainees
   * Mentor lists all active trainees enrolled in a space.
   */
  async getSpaceTrainees(spaceId: string): Promise<SpaceMemberSummary[]> {
    const response = await axiosClient.get<SpaceMemberSummary[]>(
      `/spaces/${spaceId}/trainees`
    );
    return response.data;
  },

  /**
   * POST /spaces/:spaceId/trainees
   * Mentor manually adds one or more trainees.
   */
  async addTrainees(spaceId: string, payload: SpaceAddTraineesRequest): Promise<void> {
    await axiosClient.post(`/spaces/${spaceId}/trainees`, payload);
  },

  /**
   * DELETE /spaces/:spaceId/trainees
   * Mentor soft-removes a trainee (preserves historical data).
   */
  async removeTrainee(spaceId: string, payload: SpaceRemoveTraineeRequest): Promise<void> {
    await axiosClient.delete(`/spaces/${spaceId}/trainees`, { data: payload });
  },

  /**
   * POST /spaces/join
   * Trainee joins a published space via invite code.
   */
  async joinSpace(payload: SpaceJoinRequest): Promise<SpaceJoinResponse> {
    const response = await axiosClient.post<SpaceJoinResponse>("/spaces/join", payload);
    return response.data;
  },
};
