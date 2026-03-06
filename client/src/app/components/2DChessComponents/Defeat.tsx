import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Crown, TrendingUp, Trophy } from "lucide-react";

interface DefeatOverlayProps {
  result: string;
  rating: number;
  increment: number;
  onClose: () => void;
}

const DefeatOverlay: React.FC<DefeatOverlayProps> = ({
  result,
  rating,
  increment,
  onClose,
}) => {
  const getResultIcon = () => {
    switch (result) {
      case "win":
        return <Crown className="w-16 h-16 text-yellow-500" />;
      case "loss":
        return <Trophy className="w-16 h-16 text-gray-500" />;
      case "draw":
        return <TrendingUp className="w-16 h-16 text-blue-500" />;
      default:
        return null;
    }
  };

  const getResultText = () => {
    switch (result) {
      case "win":
        return "Victory!";
      case "loss":
        return "Defeat";
      case "draw":
        return "Draw";
      default:
        return "";
    }
  };

  const getResultColor = () => {
    switch (result) {
      case "win":
        return "text-yellow-500";
      case "loss":
        return "text-red-500";
      case "draw":
        return "text-blue-500";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <Card className="p-8 max-w-md w-full mx-4 text-center">
        <div className="flex flex-col items-center space-y-6">
          {getResultIcon()}

          <div>
            <h2 className={`text-3xl font-bold ${getResultColor()}`}>
              {getResultText()}
            </h2>
            <p className="text-muted-foreground mt-2">Game completed</p>
          </div>

          <div className="space-y-4 w-full">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Current Rating:
              </span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {rating}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Rating Change:
              </span>
              <Badge
                variant={result === "win" ? "default" : "destructive"}
                className="text-lg px-3 py-1"
              >
                {result === "win" ? "+" : ""}
                {increment}
              </Badge>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">New Rating:</span>
              <Badge variant="outline" className="text-xl px-4 py-2 font-bold">
                {rating + increment}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onClose}
            >
              New Game
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DefeatOverlay;
