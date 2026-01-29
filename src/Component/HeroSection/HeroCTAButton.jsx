import React from "react";
import { Button } from "../../Component/UI/button";
import { Activity } from "lucide-react";

const HeroCTAButton = ({ onClick, children, className = "", icon }) => {
  return (
    <Button
      className={
        `bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 px-6 h-11 ` +
        className
      }
      onClick={onClick}
    >
      {icon ? icon : <Activity className="w-4 h-4" />}
      {children}
    </Button>
  );
};

export default HeroCTAButton;