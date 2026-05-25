interface EmptyIconProps {
  title?: string;
  description?: string;
}

const EmptyIcon = ({ title, description }: EmptyIconProps) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="500"
        height="400"
        viewBox="0 0 600 400"
        fill="none"
      >
        <path
          d="M300 350H100C88.9543 350 80 341.046 80 330V70C80 58.9543 88.9543 50 100 50H500C511.046 50 520 58.9543 520 70V330C520 341.046 511.046 350 500 350H300Z"
          fill="#F5F5F5"
          stroke="#E0E0E0"
          strokeWidth="2"
        />
        <path
          d="M300 200C300 188.954 308.954 180 320 180H460C471.046 180 480 188.954 480 200V290C480 301.046 471.046 310 460 310H320C308.954 310 300 301.046 300 290V200Z"
          fill="#FAFAFA"
          stroke="#E0E0E0"
          strokeWidth="2"
        />
        <path
          d="M120 90H260M120 130H200M120 170H240"
          stroke="#E0E0E0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <circle cx="390" cy="245" r="40" fill="#E0E0E0" />
        <path
          d="M375 245L385 255L405 235"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {description && <p className="text-gray-500">{description}</p>}
    </div>
  );
};

export default EmptyIcon;
