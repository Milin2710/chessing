"use client";

import { Button } from "@components/ui/button";
import { useState, useEffect } from "react";
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
import axios from "axios";
import { useUser } from "@clerk/nextjs";

interface RecentGame {
  opponent: string;
  result: "win" | "loss" | "draw";
  moveslength: number;
  moves: number[];
  playedas: string;
  date: string;
}

export default function Games() {
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const { user } = useUser();
  const [expandedGame, setExpandedGame] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.username) return;
    const response = axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/all-games?username=${user.username}`
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
        setTotalGames(res.data.totalGames);
      })
      .catch((error) => {
        console.error("Error fetching recent games:", error);
      });
  }, [user?.username]);
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
    <div className="lg:col-span-2">
      <Card>
        <div className=" w-2/3 mx-auto">
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
                          {game.playedas.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{game.opponent}</p>
                        <p className="text-sm text-muted-foreground">
                          {/* Rating: {game.rating} */}
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
                        {game.moveslength % 2 === 1
                          ? game.moveslength / 2 + 0.5
                          : game.moveslength / 2}{" "}
                        moves
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
              <Button variant="outline">View All Games</Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
