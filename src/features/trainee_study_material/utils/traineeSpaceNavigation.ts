/** Build trainee space URLs that restore the selected topic outline node. */
export function traineeSpaceUrl(spaceId: string, nodeId?: string | null): string {
  const base = `/trainee/spaces/${spaceId}`;
  if (!nodeId) return base;
  return `${base}?node=${encodeURIComponent(nodeId)}`;
}
