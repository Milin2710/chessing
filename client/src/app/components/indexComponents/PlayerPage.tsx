"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import {
  Play,
  Search,
  Trophy,
  Clock,
  Target,
  Users,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import HealthBar from "./HealthBar";
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

interface PlayerPageProps {
  user: {
    username: string;
    rating: number;
    profilePhoto?: string;
  };
  recentGames: RecentGame[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: string[];
  searchResultsHistory: string[];
  totalGames: number;
  lastOnline: string | null;
  self: boolean;
}

const PlayerPage: React.FC<PlayerPageProps> = ({
  user,
  recentGames,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchResultsHistory,
  totalGames,
  lastOnline,
  self,
}) => {
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  console.log("Rendering PlayerPage with user:", user);
  console.log("games", recentGames);
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  const handleUserClick = (username: string) => {
    console.log("saving", username);
    addToSearchHistory(username);
    setHistory(getSearchHistory());
  };

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

  function timeAgo(input: Date) {
    const then =
      typeof input === "string" || typeof input === "number"
        ? new Date(input)
        : input instanceof Date
        ? input
        : null;

    if (!then || Number.isNaN(then.getTime())) return "";

    const now = Date.now();
    let diff = Math.floor((now - then.getTime()) / 1000); // seconds

    if (diff < 0) diff = 0; // future dates -> treat as now

    if (diff < 10) return "just now";
    if (diff < 60) return `${diff} sec ago`;

    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min ago`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

    const months = Math.floor(days / 30);
    if (months < 12)
      return `${months} ${months === 1 ? "month" : "months"} ago`;

    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }
  const toggleGameExpansion = (index: number) => {
    setExpandedGame(expandedGame === index ? null : index);
  };
  const indexToSquare = (i: number): string => {
    if (i < 0 || i > 63) throw new Error("index out of bounds");
    const files = "abcdefgh";
    const file = files[i % 8];
    const rank = 8 - Math.floor(i / 8);
    return `${file}${rank}`;
  };

  const pieceLetter = (pid: number): "" | "N" | "B" | "R" | "Q" | "K" => {
    const isWhite = pid >= 16;
    // pawns
    if (
      (isWhite && pid >= 16 && pid <= 23) ||
      (!isWhite && pid >= 8 && pid <= 15)
    )
      return "";
    // others
    if (
      (!isWhite && (pid === 0 || pid === 7)) ||
      (isWhite && (pid === 24 || pid === 31))
    )
      return "R";
    if (
      (!isWhite && (pid === 1 || pid === 6)) ||
      (isWhite && (pid === 25 || pid === 30))
    )
      return "N";
    if (
      (!isWhite && (pid === 2 || pid === 5)) ||
      (isWhite && (pid === 26 || pid === 29))
    )
      return "B";
    if ((!isWhite && pid === 3) || (isWhite && pid === 27)) return "Q";
    if ((!isWhite && pid === 4) || (isWhite && pid === 28)) return "K";
    return "";
  };
  const getMovesFromHistory = (historywithoutinit: number[][]): string[] => {
    const initialPosition = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 48, 49, 50, 51, 52,
      53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
    ];
    const moves: string[] = [];

    const history = [initialPosition, ...historywithoutinit];
    if (!Array.isArray(history) || history.length < 2) return [];

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      // find all changed pieces
      const changed: number[] = [];
      for (let p = 0; p < 32; p++) if (prev[p] !== curr[p]) changed.push(p);
      if (changed.length === 0) {
        moves.push("");
        continue;
      }

      // prefer the *mover* (the one that has a destination, not -1)
      const mover = changed.find((p) => curr[p] !== -1);
      if (mover == null) {
        moves.push("");
        continue;
      }

      const from = prev[mover];
      const to = curr[mover];
      if (from < 0 || to < 0 || from > 63 || to > 63) {
        moves.push("");
        continue;
      }

      // detect capture (any opponent piece that became -1)
      const capturedIdx = changed.find(
        (p) => p !== mover && prev[p] !== -1 && curr[p] === -1
      );
      const isCapture = capturedIdx != null;

      const piece = pieceLetter(mover);
      const dest = indexToSquare(to);

      // SAN-ish
      let san: string;
      if (piece === "") {
        // pawn
        if (isCapture) {
          const fromFile = indexToSquare(from)[0];
          san = `${fromFile}x${dest}`;
        } else {
          san = dest;
        }
      } else {
        san = `${piece}${isCapture ? "x" : ""}${dest}`;
      }

      moves.push(san);
    }
    return moves;
  };

  function generateFEN(position: number[], playedas: string): string {
    const board: (string | null)[] = Array(64).fill(null);

    const pieceOrder = [
      "r",
      "n",
      "b",
      "q",
      "k",
      "b",
      "n",
      "r", // black back rank
      "p",
      "p",
      "p",
      "p",
      "p",
      "p",
      "p",
      "p", // black pawns
      "P",
      "P",
      "P",
      "P",
      "P",
      "P",
      "P",
      "P", // white pawns
      "R",
      "N",
      "B",
      "Q",
      "K",
      "B",
      "N",
      "R", // white back rank
    ];

    // Place pieces on the board
    for (let i = 0; i < 32; i++) {
      const square = position[i];
      if (square >= 0 && square < 64) {
        board[square] = pieceOrder[i];
      }
    }

    // Build FEN rank by rank
    let fen = "";
    for (let rank = 0; rank < 8; rank++) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const squareIndex = rank * 8 + file; // a8=0 → h1=63
        const piece = board[squareIndex];
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          fen += piece;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (rank !== 7) fen += "/";
    }
    if (playedas === "black") fen = fen.split("/").reverse().join("/");
    return fen + " w KQkq - 0 1"; // standard extras
  }

  const renderChessBoard = (fen: string) => {
    const board = fen.split(" ")[0].split("/");
    const pieces: { [key: string]: string } = {
      K: "♔",
      Q: "♕",
      R: "♖",
      B: "♗",
      N: "♘",
      P: "♙",
      k: "♚",
      q: "♛",
      r: "♜",
      b: "♝",
      n: "♞",
      p: "♟",
    };

    return (
      <div className="grid grid-cols-8 gap-0 w-64 h-64 mx-auto border-2 border-gray-300">
        {board.map((row, rowIndex) => {
          let colIndex = 0;
          const squares = [];
          for (const char of row) {
            if (isNaN(Number.parseInt(char))) {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              squares.push(
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`w-8 h-8 flex items-center justify-center text-lg ${
                    isLight ? "bg-amber-100" : "bg-amber-800"
                  }`}
                >
                  {pieces[char] || ""}
                </div>
              );
              colIndex++;
            } else {
              const emptySquares = Number.parseInt(char);
              for (let i = 0; i < emptySquares; i++) {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                squares.push(
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-8 h-8 ${
                      isLight ? "bg-amber-100" : "bg-amber-800"
                    }`}
                  />
                );
                colIndex++;
              }
            }
          }
          return squares;
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* User Profile Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.profilePhoto} />
                <AvatarFallback>{user.username}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.username}</h3>
                <Badge variant="secondary" className="mt-1">
                  <Trophy className="w-3 h-3 mr-1" />
                  {user.rating}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Games Played</span>
                <span className="font-semibold">{totalGames}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Win Rate</span>
                {/* <span className="font-semibold text-green-600"> */}
                <HealthBar
                  win={calculateStats(recentGames).win}
                  loss={calculateStats(recentGames).loss}
                  draw={calculateStats(recentGames).draw}
                />
                {/* {calculateStats(recentGames).win}% */}
                {/* </span> */}
              </div>
              <div className="pt-4">
                <Link href="/games">
                  <Button className="w-full bg-transparent" variant="outline">
                    <Target className="w-4 h-4 mr-2" />
                    View Full Stats
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last online */}
        {!self && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Last online: {lastOnline ? lastOnline : "Never"}
            </p>
          </div>
        )}

        {self && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by username..."
                  className="flex-1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {searchResults.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Results:</h3>
                  <ul className="space-y-1">
                    {searchResults.map((result, index) => (
                      <li
                        key={index}
                        onClick={() => handleUserClick(result)}
                        className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                      >
                        <Link target="_blank" href={`/profile/${result}`}>
                          {result}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                searchResultsHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">History:</h3>
                    <ul className="space-y-1">
                      {searchResultsHistory.map((result, index) => (
                        <li
                          key={index}
                          onClick={() => handleUserClick(result)}
                          className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                        >
                          <Link target="_blank" href={`/profile/${result}`}>
                            {result}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Game History */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => toggleGameExpansion(index)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {self && game.playedas.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{game.opponent}</p>
                        <p className="text-sm text-muted-foreground">
                          Rating: {game.rating}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <Badge
                        variant={
                          game.result === "win"
                            ? "default"
                            : game.result === "loss"
                            ? "destructive"
                            : "secondary"
                        }
                        className="mb-1"
                      >
                        {game.result.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {game.moveslength} moves
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {game.date}
                      </p>
                      {expandedGame === index ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {expandedGame === index && (
                    <div className="border-t bg-accent/20 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Game Moves */}
                        <div>
                          <h4 className="font-semibold mb-3">Game Moves</h4>
                          <div className="bg-background rounded p-3 max-h-48 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                              {getMovesFromHistory(game.moves).map(
                                (move, moveIndex) => (
                                  <div key={moveIndex} className="flex">
                                    {moveIndex % 2 === 0 && (
                                      <span className="text-muted-foreground mr-2 w-6">
                                        {Math.floor(moveIndex / 2) + 1}.
                                      </span>
                                    )}
                                    <span>{move}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Final Position */}
                        <div>
                          <h4 className="font-semibold mb-3">Final Position</h4>
                          {renderChessBoard(
                            generateFEN(
                              game.moves[game.moveslength - 1],
                              game.playedas
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/games">
                <Button variant="outline">View All Games</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerPage;
