import { Card, CardContent } from "@components/ui/card";
import { Play, Target, Users } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Link href={"/play"}>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Quick Play</h3>
            <p className="text-muted-foreground">Find an opponent instantly</p>
          </CardContent>
        </Card>
      </Link>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Puzzles</h3>
          <p className="text-muted-foreground">Improve your tactics</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Tournaments</h3>
          <p className="text-muted-foreground">Compete with others</p>
        </CardContent>
      </Card>
    </div>
  );
}
