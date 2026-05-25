"use client";

import { MarkDto } from "../../_components/assistance.dto";
import { getFaceRecognitionStatusMeta } from "../_utils/face-recognition";

interface FaceRecognitionBadgeProps {
  mark: Pick<MarkDto, "faceRecognitionStatus" | "photoUrl">;
}

export default function FaceRecognitionBadge({
  mark,
}: FaceRecognitionBadgeProps) {
  const meta = getFaceRecognitionStatusMeta(mark);

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
