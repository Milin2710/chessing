"use client";

import PlayerPage from "@/app/components/indexComponents/PlayerPage";
import axios from "axios";
import { use, useEffect, useState } from "react";

interface User {
  username: string;
  rating: number;
  profilePhoto?: string;
}
interface RecentGame {
  opponent: string;
  result: "win" | "loss" | "draw";
  moveslength: number;
  moves: number[];
  playedas: string;
  date: string;
}
export default function Profile({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const { user } = use(params);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [userData, setUserData] = useState<User | null>(null);
  const [lastOnline, setLastOnline] = useState<string | null>(null);
  const [totalGames, setTotalGames] = useState(0);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
        <p className="text-lg">The requested user profile does not exist.</p>
      </div>
    );
  }
  useEffect(() => {
    console.log("Fetching user data for:", user);
    const response = axios.get(
      `http://localhost:4000/get-user?username=${user}`
    );
    response
      .then((res) => {
        console.log("User data fetched successfully:", res.data);
        setUserData({
          username: res.data.username,
          rating: res.data.rating,
          profilePhoto: res.data.profilePhoto,
        });
        setLastOnline(
          new Date(res.data.lastOnline).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
        setRecentGames(
          res.data.games.map((game: any) => {
            const isWhite = game.playerw === user;
            const opponent = isWhite ? game.playerb : game.playerw;

            let result: "win" | "loss" | "draw";
            if (game.result === "draw") {
              result = "draw";
            } else if (
              (game.result === "white won" && isWhite) ||
              (game.result === "black won" && !isWhite)
            ) {
              result = "win";
            } else {
              result = "loss";
            }
            console.log(game.createdAt);

            return {
              opponent,
              result,
              moveslength: game.moves.length,
              moves: game.moves,
              playedas: game.playedas,
              date: new Date(game.createdAt).toLocaleDateString(),
            };
          })
        );
        setTotalGames(res.data.totalGames);

        console.log("User data:", {
          username: res.data.username,
          rating: res.data.rating,
        });
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userData ? (
          <PlayerPage
            user={userData}
            recentGames={recentGames}
            searchQuery=""
            setSearchQuery={() => {}}
            searchResults={[]}
            totalGames={totalGames}
            lastOnline={lastOnline}
            self={false}
          />
        ) : (
          <p>Loading...</p>
        )}
      </main>
    </div>
  );
}
