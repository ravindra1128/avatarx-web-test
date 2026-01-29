import React from "react";
import { Loader2 } from "lucide-react";
const Loader = ({ msg }) => {
  return (
    <div className="flex flex-col justify-center items-center fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999]">
      <Loader2 className="w-12 h-12 animate-spin text-blue" />
      {msg && <p className="text-white text-lg">{msg}</p>}
    </div>
  );
};

export default Loader;
