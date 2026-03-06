"use client";


import { useState, useEffect } from "react";

interface VictoryOverlayProps {
  result: string;
  rating: number;
  increment: number;
}

const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  result,
  rating,
  increment,
}) => {
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
      <div className="text-white-600 text-lg font-bold">
        {result || "Victory!"}
        <h1>
          {rating} + {increment}
        </h1>
      </div>
    </div>
  );
};

export default VictoryOverlay;
