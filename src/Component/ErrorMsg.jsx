export default function ErrorMsg({ error, className }) {
  return <p className={`text-red-500 text-sm mt-1 ${className}`}>{error}</p>;
}


