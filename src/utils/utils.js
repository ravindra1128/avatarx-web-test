export function cn(...classes) {
  return classes.filter((cls) => cls).join(" ");
}

  // Format timer as mm:ss or h:mm:ss
  export const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      // Format as h:mm:ss when there are hours
      const hStr = hours.toString();
      const mStr = minutes.toString().padStart(2, "0");
      const sStr = secs.toString().padStart(2, "0");
      return `${hStr}:${mStr}:${sStr}`;
    } else {
      // Format as mm:ss when no hours
      const mStr = minutes.toString().padStart(1, "0");
      const sStr = secs.toString().padStart(2, "0");
      return `${mStr}:${sStr}`;
    }
  };

  // Helper function to round vitals numbers
  export const roundVital = (value) => {
    if (value === null || value === undefined) return value;
    return Math.round(parseFloat(value));
  };

  export const getClientTimeZone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };