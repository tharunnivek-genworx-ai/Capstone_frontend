import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface ModalPortalProps {
  children: ReactNode;
}

/** Renders modals on document.body so they sit above the node detail header. */
const ModalPortal: React.FC<ModalPortalProps> = ({ children }) =>
  createPortal(children, document.body);

export default ModalPortal;
