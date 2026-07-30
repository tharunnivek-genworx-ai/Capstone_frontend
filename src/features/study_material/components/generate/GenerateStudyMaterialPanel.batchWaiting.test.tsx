import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { NodeTreeNode } from "../../../spaces/types/node.types";
import type { UseStudyMaterialReturn } from "../../hooks/useStudyMaterial";
import type { BatchStepStatus } from "../../types/studyMaterialBatch.types";
import { isGenerateAllStepWaiting } from "../../utils/batchHubEligibility";
import GenerateStudyMaterialPanel from "./GenerateStudyMaterialPanel";

vi.mock("./SectionDefaultStyleCard", () => ({ default: () => null }));
vi.mock("./ApproachChooser", () => ({ default: () => null }));
vi.mock("./InstructionPreviewAccordion", () => ({ default: () => null }));

const node: NodeTreeNode = {
  node_id: "node-1",
  parent_id: null,
  title: "Topic A",
  level: 1,
  order_index: 0,
  node_specific_instruction: null,
  tree_default_instruction: null,
  node_additive_instruction: null,
  effective_instruction: null,
  effective_instruction_parts: [],
  is_active: true,
  auto_generated: false,
  children: [],
};

function makeStudyMaterial(isGenerating: boolean): UseStudyMaterialReturn {
  return {
    referenceMaterial: null,
    externalResearchEnabled: false,
    setExternalResearchEnabled: vi.fn(),
    nodeMedia: [],
    hasWorkspaceStudyMaterial: false,
    canClearAllDrafts: true,
    clearDraftsBlockReason: null,
    isGenerating,
    isDeletingDrafts: false,
    isLoadingGenerationSource: false,
    isLoadingTopicResources: false,
    setCurrentPage: vi.fn(),
    handleGenerateStudyMaterial: vi.fn(),
    setShowRegenerateConfirmModal: vi.fn(),
    showInstructionChangeBanner: false,
    handleUseNewInstructions: vi.fn(),
    handleKeepExistingDraftsAfterMove: vi.fn(),
  } as unknown as UseStudyMaterialReturn;
}

function renderForBatchStep(status: BatchStepStatus | null, isGenerating = false) {
  render(
    <GenerateStudyMaterialPanel
      node={node}
      mode="inherit"
      onModeChange={vi.fn()}
      modeText=""
      onModeTextChange={vi.fn()}
      branchDefault=""
      onBranchDefaultChange={vi.fn()}
      previewParts={[]}
      isSaving={false}
      showSavedConfirm={false}
      onSave={vi.fn()}
      onDiscard={vi.fn()}
      onNavigateToNode={vi.fn()}
      sm={makeStudyMaterial(isGenerating)}
      onOpenRefModal={vi.fn()}
      onOpenMediaModal={vi.fn()}
      isQueuedInGenerateAll={isGenerateAllStepWaiting(status)}
    />,
  );
}

describe("Generate All waiting parity", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows queued copy and disables manual generation for a pending step", () => {
    renderForBatchStep("pending");

    expect(screen.getByText("Queued in Generate All")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Waiting/ })).toBeDisabled();
  });

  it("suppresses queued setup copy once the running step is generating", () => {
    renderForBatchStep("running", true);

    expect(screen.queryByText("Queued in Generate All")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generating/ })).toBeDisabled();
  });

  it.each([
    ["completed", "completed"],
    ["no batch step", null],
  ] as const)("allows manual generation for %s", (_label, status) => {
    renderForBatchStep(status);

    expect(screen.queryByText("Queued in Generate All")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create lesson draft with AI" }),
    ).toBeEnabled();
  });
});
