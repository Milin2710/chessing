"use client";

import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import axios from "axios";
import PlayerPage from "./components/indexComponents/PlayerPage";
import QuickActions from "./components/indexComponents/QuickActions";
import { Button } from "./components/ui/button";
import { Play } from "lucide-react";
import Link from "next/link";
import { getSearchHistory, addToSearchHistory } from "@/lib/utils";

interface RecentGame {
  opponent: string;
  result: "win" | "loss" | "draw";
  moveslength: number;
  moves: number[];
  playedas: string;
  rating: number;
  date: string;
}
interface User {
  username: string;
  rating: number;
  profilePhoto?: string;
}

export default function Home() {
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [searchResultsHistory, setSearchResultsHistory] = useState<string[]>(
    []
  );
  const [totalGames, setTotalGames] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [userData, setUserData] = useState<User | null>(null);

  const { user } = useUser();

  useEffect(() => {
    if (!user?.username) return;
    const response = axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/get-auth-user?username=${user.username}`
    );
    response
      .then((res) => {
        console.log("Recent games fetched:", res.data);
        setRecentGames(
          res.data.games.map((game: any) => {
            const isWhite = game.playerw === user.username;
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
        setUserData({
          username: res.data.username,
          rating: res.data.rating,
          profilePhoto: res.data.profilePhoto,
        });
        setTotalGames(res.data.totalGames);
        setSearchResultsHistory(getSearchHistory());
      })
      .catch((error) => {
        console.error("Error fetching recent games:", error);
      });
  }, [user?.username]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/search-users?query=${debouncedQuery}`
        );
        setSearchResults(response.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery]);

  function calculateStats(games: RecentGame[]) {
    const total = games.length;
    if (total === 0) {
      return { win: 0, loss: 0, draw: 0 };
    }

    const win = games.filter((g) => g.result === "win").length;
    const loss = games.filter((g) => g.result === "loss").length;
    const draw = games.filter((g) => g.result === "draw").length;

    return {
      win: Math.round((win / total) * 100),
      loss: Math.round((loss / total) * 100),
      draw: Math.round((draw / total) * 100),
    };
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  console.log("Rendering Home with user:", user);
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        <div className="text-center mt-10">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Welcome to Zugzwang
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master the game of chess with millions of players worldwide
          </p>

          {/* Quick Play Button */}
          <Link href="/play">
            <Button size="lg" className="text-lg px-8 py-6">
              <Play className="w-6 h-6 mr-2" />
              Play Now
            </Button>
          </Link>
        </div>
        {/* Quick Actions */}
        <QuickActions />

        <PlayerPage
          user={{
            ...user,
            profilePhoto: user.imageUrl,
            rating: userData?.rating,
          }}
          recentGames={recentGames}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searchResultsHistory={searchResultsHistory}
          totalGames={totalGames}
          lastOnline="none"
          self={true}
        />
      </main>
    </div>
  );
}
