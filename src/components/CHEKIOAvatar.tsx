import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export interface CHEKIOAvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function CHEKIOAvatar({
  src,
  alt,
  fallback,
  size = "default",
  className,
}: CHEKIOAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100",
        sizeClasses[size],
        className
      )}
    >
      {showFallback ? (
        <span className="font-medium text-gray-600">{fallback}</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

/**
 * Utility function to get initials from a name
 * @param name - Full name of the user
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
