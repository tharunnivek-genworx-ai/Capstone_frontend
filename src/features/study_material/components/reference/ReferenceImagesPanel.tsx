import React, { useEffect, useMemo, useState } from "react";
import type { ReferenceImageOut } from "../../types/studyMaterial.types";
import { referenceMaterialService } from "../../services/referenceMaterialService";

interface ReferenceImagesPanelProps {
  nodeId: string;
  materialId: string | null | undefined;
  /** Bumped after generation so newly extracted images are re-fetched. */
  refreshKey?: string | null;
}

const ReferenceImagesPanel: React.FC<ReferenceImagesPanelProps> = ({
  nodeId,
  materialId,
  refreshKey,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [images, setImages] = useState<ReferenceImageOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!materialId) {
      setImages([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    referenceMaterialService
      .listReferenceImages(nodeId, materialId)
      .then((result) => {
        if (cancelled) return;
        setImages(result.items);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load reference images.");
          setImages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, materialId, refreshKey]);

  const imageCountLabel = useMemo(
    () => (images.length === 1 ? "1 image" : `${images.length} images`),
    [images.length]
  );

  if (!materialId) return null;

  return (
    <div className="reference-images-panel">
      <button
        type="button"
        className="reference-images-panel__toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span>Reference images from PDF</span>
        <span className="reference-images-panel__count">{imageCountLabel}</span>
      </button>

      {isOpen && (
        <div className="reference-images-panel__body">
          {isLoading && <p className="reference-images-panel__status">Loading images…</p>}
          {error && <p className="reference-images-panel__status reference-images-panel__status--error">{error}</p>}
          {!isLoading && !error && images.length === 0 && (
            <p className="reference-images-panel__status">No images extracted from this PDF yet.</p>
          )}
          <div className="reference-images-panel__scroll">
            {images.map((img) => (
              <figure key={img.llamaparse_image_id ?? img.url} className="reference-images-panel__figure">
                <img
                  className="reference-images-panel__image"
                  src={img.url}
                  alt={img.title ?? img.filename}
                  loading="lazy"
                />
                <figcaption className="reference-images-panel__caption">
                  {img.title ?? img.filename}
                  {img.source_page != null && (
                    <span className="reference-images-panel__page"> · p. {img.source_page}</span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceImagesPanel;
