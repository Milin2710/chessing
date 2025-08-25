import React from "react";

interface HealthBarProps {
  win: number;
  loss: number;
  draw: number;
}

const HealthBar: React.FC<HealthBarProps> = ({ win, loss, draw }) => {
  return (
    <div className="w-full h-6 flex rounded-lg overflow-hidden shadow-md border">
      <div
        className="bg-green-500 text-xs text-white flex items-center justify-center"
        style={{ width: `${win}%` }}
      >
        {win > 5 && `${win}% W`}
      </div>
      <div
        className="bg-red-500 text-xs text-white flex items-center justify-center"
        style={{ width: `${loss}%` }}
      >
        {loss > 5 && `${loss}% L`}
      </div>
      <div
        className="bg-gray-500 text-xs text-white flex items-center justify-center"
        style={{ width: `${draw}%` }}
      >
        {draw > 5 && `${draw}% D`}
      </div>
    </div>
  );
};

export default HealthBar;
