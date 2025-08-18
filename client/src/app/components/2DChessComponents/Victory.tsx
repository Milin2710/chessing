"use client";
import { useState, useEffect } from "react";

interface VictoryOverlayProps {
  result?: string;
}

const VictoryOverlay: React.FC<VictoryOverlayProps> = ({ result }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="absolute top-0 left-0 w-full p-4 h-full flex items-center justify-center z-50">
      <img src="./Victory.gif" alt="Victory" />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-black text-lg font-bold">
        {result || "Victory!"}
      </div>
    </div>
  );
};

export default VictoryOverlay;
