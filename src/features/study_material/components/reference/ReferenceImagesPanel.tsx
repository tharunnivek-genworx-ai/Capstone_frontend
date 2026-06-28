import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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
  const [selectedImage, setSelectedImage] = useState<ReferenceImageOut | null>(null);

  const closeLightbox = useCallback(() => setSelectedImage(null), []);

  useEffect(() => {
    if (!selectedImage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedImage, closeLightbox]);

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
                <button
                  type="button"
                  className="reference-images-panel__thumb-btn"
                  onClick={() => setSelectedImage(img)}
                  aria-label={`View ${img.title ?? img.filename}`}
                >
                  <img
                    className="reference-images-panel__image"
                    src={img.url}
                    alt={img.title ?? img.filename}
                    loading="lazy"
                  />
                </button>
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

      {selectedImage &&
        createPortal(
          <div
            className="reference-image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.title ?? selectedImage.filename}
            onClick={closeLightbox}
          >
            <div
              className="reference-image-lightbox__dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="reference-image-lightbox__header">
                <p className="reference-image-lightbox__title">
                  {selectedImage.title ?? selectedImage.filename}
                  {selectedImage.source_page != null && (
                    <span className="reference-image-lightbox__page">
                      {" "}
                      · p. {selectedImage.source_page}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  className="reference-image-lightbox__close"
                  onClick={closeLightbox}
                  aria-label="Close image preview"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <div className="reference-image-lightbox__body">
                <img
                  className="reference-image-lightbox__image"
                  src={selectedImage.url}
                  alt={selectedImage.title ?? selectedImage.filename}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ReferenceImagesPanel;
