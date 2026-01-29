const CircularProgress = ({ progress, size = 120, strokeWidth = 8, color = "#3b82f6" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * Math.PI; // Half circle circumference
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
  
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size / 2}
          viewBox={`0 0 ${size} ${size / 2}`}
        >
          {/* Background semi-circle */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-30"
          />
          {/* Progress semi-circle */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center content - positioned below the semi-circle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '65%' }}>
          <div className="text-2xl font-bold text-gray-900">{Math.round(progress)}%</div>
          <div className="text-xs text-gray-500 font-medium">Complete</div>
        </div>
      </div>
    );
  };

  export default CircularProgress;