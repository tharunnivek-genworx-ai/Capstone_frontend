import studyAgentClient from "../../../lib/studyAgentClient";

/** Trigger a browser download using an authenticated trainee file endpoint. */
export async function downloadTraineeFile(
  urlPath: string,
  filename: string,
  mimeType: string
): Promise<void> {
  const response = await studyAgentClient.get<Blob>(urlPath, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/** Open a trainee file endpoint inline in a new tab (auth via axios blob). */
export async function openTraineeFileInNewTab(
  urlPath: string,
  mimeType: string
): Promise<void> {
  const response = await studyAgentClient.get<Blob>(urlPath, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
}
