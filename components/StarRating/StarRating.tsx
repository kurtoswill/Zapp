import { Star } from "lucide-react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  rating: number;       // e.g. 4.2
  max?: number;         // default 5
  size?: number;        // icon px size
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating,
  max = 5,
  size = 14,
  showValue = true,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className={styles.root}>
      {showValue && <span className={styles.value}>{rating.toFixed(1)}</span>}
      <div className={styles.stars} aria-label={`${rating} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const fill = Math.min(Math.max(rating - i, 0), 1); // 0 | 0…1 | 1
          return (
            <span key={i} className={styles.starWrap}>
              {/* Empty star */}
              <Star
                size={size}
                strokeWidth={1.5}
                className={styles.starEmpty}
              />
              {/* Filled star clipped by fill % */}
              {fill > 0 && (
                <span
                  className={styles.starFilled}
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star size={size} strokeWidth={1.5} />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className={styles.count}>({reviewCount})</span>
      )}
    </div>
  );
}