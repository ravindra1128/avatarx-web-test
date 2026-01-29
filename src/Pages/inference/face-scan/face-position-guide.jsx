// Adjust the bounding box with bottom corners moved upwards
export default function FacePositionGuide({
  faceDetected,
  faceCentered,
  scanning,
}) {
  // Higher opacity when face is detected and centered
  const borderOpacity = scanning
    ? faceDetected && faceCentered
      ? "border-opacity-80"
      : "border-opacity-50"
    : faceDetected
    ? faceCentered
      ? "border-opacity-80"
      : "border-opacity-50"
    : "border-opacity-40";

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Corner markers - with bottom corners moved upwards */}
      <div
        className={`
        absolute inset-0
        ${
          scanning
            ? faceDetected && faceCentered
              ? "opacity-100"
              : "opacity-70"
            : faceDetected
            ? "opacity-70"
            : "opacity-40"
        }
        transition-opacity duration-300
      `}>
        {/* Top corners remain the same */}
        <div
          className={`absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-white ${borderOpacity}`}></div>
        <div
          className={`absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-white ${borderOpacity}`}></div>

        {/* Bottom corners moved upwards (from bottom-4 to bottom-24) */}
        <div
          className={`absolute bottom-24 left-4 w-16 h-16 border-b-2 border-l-2 border-white ${borderOpacity}`}></div>
        <div
          className={`absolute bottom-24 right-4 w-16 h-16 border-b-2 border-r-2 border-white ${borderOpacity}`}></div>
      </div>

      {/* Scanning animation - only pulse when face is detected and centered */}
      {scanning && faceDetected && faceCentered && (
        <div className="absolute inset-0 border-4 border-emerald-500 animate-pulse"></div>
      )}
    </div>
  );
}
