"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import StarRating from "@/components/StarRating/StarRating";
import styles from "./ReviewCard.module.css";

export interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  images?: string[];
}

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = review.images ?? [];

  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i! - 1 + images.length) % images.length);
  const next = () => setLightboxIndex((i) => (i! + 1) % images.length);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <img src={review.avatar} alt={review.name} className={styles.avatar} />
          <div className={styles.meta}>
            <span className={styles.name}>{review.name}</span>
            <StarRating rating={review.rating} size={13} showValue={false} />
          </div>
        </div>

        {/* Review text */}
        <p className={styles.text}>{review.text}</p>

        {/* Images */}
        {images.length > 0 && (
          <div className={styles.images}>
            {images.map((src, i) => (
              <button
                key={i}
                className={styles.imageBtn}
                onClick={() => openLightbox(i)}
                aria-label={`View photo ${i + 1}`}
              >
                <img src={src} alt={`Review photo ${i + 1}`} className={styles.image} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onClick={closeLightbox}
        >
          {/* Image */}
          <div
            className={styles.lightboxImgWrap}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className={styles.lightboxImg}
            />

            {/* Counter */}
            {images.length > 1 && (
              <span className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {images.length}
              </span>
            )}
          </div>

          {/* Close */}
          <button
            className={styles.lightboxClose}
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} strokeWidth={2} />
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
              >
                <ChevronRight size={22} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}