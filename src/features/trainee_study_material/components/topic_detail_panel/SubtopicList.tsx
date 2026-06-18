import React from "react";
import type { SubtopicPanelItem } from "../../types/traineeNodePanel.types";
import SubtopicCard from "./SubtopicCard";

interface SubtopicListProps {
  subtopics: SubtopicPanelItem[];
  onNavigate: (nodeId: string) => void;
}

const SubtopicList: React.FC<SubtopicListProps> = ({ subtopics, onNavigate }) => (
  <div>
    {subtopics.map((subtopic) => (
      <SubtopicCard key={subtopic.node_id} subtopic={subtopic} onNavigate={onNavigate} />
    ))}
  </div>
);

export default SubtopicList;
