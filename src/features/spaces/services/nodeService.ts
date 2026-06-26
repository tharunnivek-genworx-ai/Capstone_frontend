// src/features/spaces/services/nodeService.ts
/**
 * Node (topic tree) API service — all calls against node/tree endpoints.
 * Reference: src/api/rest/routes/space_node_routes/node_route.py
 */

import axiosClient from "../../../lib/axiosClient";
import type {
  NodeCreateRequest,
  NodeRenameRequest,
  NodeUpdateInstructionRequest,
  NodeReparentRequest,
  NodeReorderRequest,
  NodeArchiveRequest,
  NodeResponse,
  NodeTreeResponse,
} from "../types/node.types";

export const nodeService = {
  /**
   * POST /spaces/:spaceId/nodes
   * Create a node in the topic tree.
   * parent_id = null → root topic.
   */
  async createNode(spaceId: string, payload: NodeCreateRequest): Promise<NodeResponse> {
    const response = await axiosClient.post<NodeResponse>(
      `/spaces/${spaceId}/nodes`,
      payload
    );
    return response.data;
  },

  /**
   * GET /spaces/:spaceId/tree
   * Returns full recursive topic tree (only is_active nodes).
   */
  async getTree(spaceId: string): Promise<NodeTreeResponse> {
    const response = await axiosClient.get<NodeTreeResponse>(
      `/spaces/${spaceId}/tree`
    );
    return response.data;
  },

  /**
   * PATCH /nodes/:nodeId/rename
   * Rename a node's title. node_id remains stable (EC-1).
   */
  async renameNode(nodeId: string, payload: NodeRenameRequest): Promise<NodeResponse> {
    const response = await axiosClient.patch<NodeResponse>(
      `/nodes/${nodeId}/rename`,
      payload
    );
    return response.data;
  },

  /**
   * PATCH /nodes/:nodeId/instruction
   * Update or clear node-specific / tree-default teaching instructions.
   */
  async updateNodeInstruction(
    nodeId: string,
    payload: NodeUpdateInstructionRequest
  ): Promise<NodeResponse> {
    const response = await axiosClient.patch<NodeResponse>(
      `/nodes/${nodeId}/instruction`,
      payload
    );
    return response.data;
  },

  /**
   * PATCH /nodes/:nodeId/reparent
   * Move node (and its subtree) to a new parent, or promote to root.
   * Service validates against circular references and cross-space moves.
   */
  async reparentNode(nodeId: string, payload: NodeReparentRequest): Promise<NodeResponse> {
    const response = await axiosClient.patch<NodeResponse>(
      `/nodes/${nodeId}/reparent`,
      payload
    );
    return response.data;
  },

  /**
   * PATCH /nodes/:nodeId/reorder
   * Reorder a sibling node by moving it up or down.
   */
  async reorderNode(nodeId: string, payload: NodeReorderRequest): Promise<void> {
    await axiosClient.patch(`/nodes/${nodeId}/reorder`, payload);
  },

  /**
   * PATCH /nodes/:nodeId/archive
   * Soft-archive a node (is_active = false).
   * If archive_children = true, all descendants are archived recursively.
   */
  async archiveNode(nodeId: string, payload: NodeArchiveRequest): Promise<void> {
    await axiosClient.patch(`/nodes/${nodeId}/archive`, payload);
  },
};
