"use client";

import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { useState } from "react";

interface GameControlsProps {
  opponentusername: string;
  opponentrating: number;
  myrating: number;
  myusername: string;
}

type GameResult = "win" | "loss" | "draw" | null;
const GameControls: React.FC<GameControlsProps> = ({
  opponentusername,
  opponentrating,
  myrating,
  myusername,
}) => {
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const handleResign = () => {
    setGameResult("loss");
  };

  const handleDraw = () => {
    setGameResult("draw");
  };
  const simulateWin = () => {
    setGameResult("win");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Game Controls</h3>
        <div className="space-y-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleResign}
          >
            Resign
          </Button>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleDraw}
          >
            Offer Draw
          </Button>
          <Button variant="secondary" className="w-full" onClick={simulateWin}>
            Simulate Win (Demo)
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Player Info</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">You</span>
            <Badge variant="secondary">1547</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Opponent</span>
            <Badge variant="secondary">1523</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Game Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time Control:</span>
            <span>10+0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your Time:</span>
            <span className="font-mono">9:42</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Opponent Time:</span>
            <span className="font-mono">8:15</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameControls;
