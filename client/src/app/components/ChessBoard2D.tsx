"use client";

import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
import { getSocket } from "@/lib/socket";
import HandshakeAnimation from "./2DChessComponents/HandShake";
import { Button } from "./ui/button";
import { User } from "lucide-react";
import Userinfo from "./Userinfo";
import DraggingPiece from "./2DChessComponents/DraggingPiece";
import PairingOverlay from "./2DChessComponents/Pairing";
import { useTheme } from "./ThemeProvider";
import { useUser } from "@clerk/nextjs";
import VictoryOverlay from "./2DChessComponents/Victory";

export default function ChessBoard2D() {
  const { theme } = useTheme();
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>You must be signed in</div>;
  }

  // Reference to the chessboard container DOM element
  const boardRef = useRef<HTMLDivElement | null>(null);
  // const socket = io("http://localhost:4000");
  console.log("conn");

  const socket = getSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      console.log("User data:", user);
      socket.emit("join", {
        clerkId: user?.id,
        username: user?.username,
        email: user?.primaryEmailAddress?.emailAddress,
      });
    });

    return () => {
      socket.emit("leave", { clerkId: user?.id, username: user?.username });
      socket.off("connect");
    };
  }, []);

  // The size of each square in pixels (used for positioning pieces)
  const [cellSize, setCellSize] = useState(80);

  // Initial setup: top 2 rows (0–15) and bottom 2 rows (48–63) have pieces
  const initialPositions = [
    ...Array.from({ length: 16 }, (_, i) => i), // Top 2 rows
    ...Array.from({ length: 16 }, (_, i) => 48 + i), // Bottom 2 rows
  ];

  const [result, setResult] = useState<string | null>(null);

  // Stores the square index (0–63) where each piece is located
  // Index in the array = piece ID, value = square number
  const [pieceLocations, setPieceLocations] =
    useState<number[]>(initialPositions);

  const [history, setHistory] = useState<number[][]>([initialPositions]);

  // ID of the piece currently being dragged, or null if none
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const [paired, setPaired] = useState(false);
  const [color, setColor] = useState<string>("white");

  useEffect(() => {
    socket.on(
      "system",
      (data: { paired: boolean; color?: string; opponentId?: string }) => {
        console.log("System message:", data);
        if (data.paired) {
          setPaired(true);
          setColor(data.color || "white");
          console.log("You are paired!");
          console.log("Your color:", data.color);
          console.log("Opponent socket ID:", data.opponentId);
        } else {
          setPaired(false);
        }
      }
    );
    return () => {
      socket.off("system");
    };
  }, []);

  useEffect(() => {
    socket.on("join_fail", (join: string) => {
      if (join === "already waiting") {
        console.log("Already Waiting:", join);
        alert("You are already waiting for a match!");
      } else if (join === "currently playing") {
        console.log("Currently Playing:", join);
        alert("You are currently playing a match!");
      }
      setPaired(false);
      setColor("white");
      setPieceLocations(initialPositions);
      setHistory([initialPositions]);
    });

    return () => {
      socket.off("join_fail");
    };
  }, []);

  useEffect(() => {
    socket.on("result", (result: string) => {
      console.log("result:", result);
      if (result === "Opponent left") {
        setPaired(false);
        setColor("white");
        setPieceLocations(initialPositions);
        setHistory([initialPositions]);
        setResult("Opponent left the game");
      } else {
        console.log("Game result:", result);
      }
    });

    return () => {
      socket.off("moves");
    };
  }, []);

  useEffect(() => {
    socket.on("moves", (newBoard: number[]) => {
      console.log("Received move:", newBoard);
      setPieceLocations(newBoard);
    });

    return () => {
      socket.off("moves");
    };
  }, []);

  // Position of the floating piece during drag, relative to board
  const [floatingPos, setFloatingPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // disable right click context menu on the board
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Measure the size of a square (cellSize) whenever window resizes
  useEffect(() => {
    const updateSize = () => {
      const firstCell =
        boardRef.current?.querySelector<HTMLElement>('[data-square="0"]');
      if (firstCell) {
        // Get exact cell width from DOM (important for accurate snapping)
        setCellSize(firstCell.getBoundingClientRect().width);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const canDrag = (pieceId: number) => {
    return (
      (color === "white" && pieceId >= 16) || // white pieces
      (color === "black" && pieceId < 16) // black pieces
    );
  };

  /**
   * Called when the player starts dragging a piece
   */
  const startDrag = (e: React.PointerEvent, pieceId: number) => {
    if (!canDrag(pieceId)) return;

    const board = boardRef.current!;
    const rect = board.getBoundingClientRect();

    // Calculate initial position so the piece is centered under the pointer
    const x = e.clientX - rect.left - cellSize / 2;
    const y = e.clientY - rect.top - cellSize / 2;

    // Set which piece is being dragged
    setDraggingId(pieceId);
    if (
      (color === "white" && pieceId < 16) || // black pieces
      (color === "black" && pieceId >= 16) // white pieces
    ) {
      // Not allowed to drag this piece
      return;
    }
    console.log("Dragging piece ID:", pieceId);

    // Store its starting floating position
    setFloatingPos({ x, y });

    // Add "dragging" class to board (for cursor styles, etc.)
    board.classList.add("dragging");

    // Lock pointer events to this element so drag doesn't break if pointer leaves it
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  /**
   * Updates the floating piece position as the pointer moves
   */
  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingId === null) return; // Only run if dragging
    if (!canDrag(draggingId)) return;

    const board = boardRef.current!;
    const rect = board.getBoundingClientRect();

    // Keep the dragged piece centered under the pointer
    const x = e.clientX - rect.left - cellSize / 2;
    const y = e.clientY - rect.top - cellSize / 2;

    setFloatingPos({ x, y });
  };

  /**
   * Called when the pointer is released (drop)
   * Moves the piece to the target square
   */
  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    if (!canDrag(draggingId)) {
      setDraggingId(null);
      return;
    }

    const board = boardRef.current!;
    const rect = board.getBoundingClientRect();

    // Calculate pointer position relative to board
    let relX = e.clientX - rect.left;
    let relY = e.clientY - rect.top;

    // Clamp so pointer can't be outside board
    relX = Math.max(0, Math.min(relX, rect.width - 1));
    relY = Math.max(0, Math.min(relY, rect.height - 1));

    // Convert pointer coordinates to square index
    const col = Math.floor(relX / cellSize);
    const row = Math.floor(relY / cellSize);
    const newIndex = row * 8 + col;

    // No change → exit early
    if (pieceLocations[draggingId] !== newIndex) {
      // Build new board first so both states are in sync
      const updatedBoard = (() => {
        const copy = [...pieceLocations];
        if (color === "black") {
          // Reverse the index for black pieces
          copy[draggingId] = 63 - newIndex;
        } else {
          copy[draggingId] = newIndex;
        }
        // Remove any piece already at this square
        for (let i = 0; i < copy.length; i++) {
          if (color === "black") {
            if (copy[i] === 63 - newIndex && i !== draggingId) {
              copy[i] = -1; // Empty square
            }
          } else {
            if (copy[i] === newIndex && i !== draggingId) {
              copy[i] = -1;
            }
          }
        }
        return copy;
      })();

      // Now update both states with the same snapshot
      setPieceLocations(updatedBoard);
      setHistory((h) => [...h, updatedBoard]);
      // Emit to server
      socket.emit("moves", updatedBoard);
    }

    // Reset drag state
    setDraggingId(null);
    setFloatingPos(null);
    board.classList.remove("dragging");
  };

  /**
   * Returns the piece ID at a given square, or -1 if empty
   */
  const pieceIdAtSquare = (i: number) => {
    if (color === "black") {
      i = 63 - i;
    }
    return pieceLocations.findIndex((p) => p === i);
  };

  const undoMove = () => {
    setHistory((h) => {
      if (h.length <= 1) return h; // nothing to undo
      const newHistory = h.slice(0, -1);
      setPieceLocations(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  };

  // console.log("cellSize", cellSize);
  // console.log("pieceLocations", pieceLocations);
  // console.log("theme", theme);
  // console.log("history", history);
  // console.log("draggingId", draggingId);
  // console.log("floatingPos", floatingPos);
  // console.log("socket", socket);

  return (
    <div className="flex flex-row-reverse gap-2 items-center justify-center overflow-y-hidden">
      <div className="gap-2 flex flex-col items-center">
        {/* <Userinfo /> */}
        {/* <button
          onClick={undoMove}
          className="px-3 py-1 bg-gray-700 text-white rounded mt-2 cursor-pointer"
        >
          Undo
        </button> */}
        {!paired && <PairingOverlay />}
      </div>
      <div
        onContextMenu={handleContextMenu}
        ref={boardRef}
        className={`relative grid grid-cols-8 grid-rows-8 ${theme}-gradient w-fit select-none place-self-center border-2 mt-2`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center"> */}
        {paired && <HandshakeAnimation />}
        {result && <VictoryOverlay result={result} />}

        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;

          // Calculate snake-pattern index
          const displayIndex =
            row % 2 === 0
              ? row * 8 + col + 1 - 65 // normal left-to-right
              : row * 8 + (8 - col) - 65; // reversed right-to-left

          const pid = pieceIdAtSquare(i);
          //   console.log("pid", pid, "i", i, "displayIndex", displayIndex);
          const hasPiece = pid !== -1;
          const isDraggedHere = pid === draggingId;

          return (
            <div
              key={i}
              data-square={i}
              className={`flex items-center justify-center relative ${
                displayIndex % 2 === 0 ? "bg-white" : "bg-transparent"
              }`}
              style={{ width: cellSize, height: cellSize }}
            >
              {/* <span className="absolute">{displayIndex}</span> */}
              {hasPiece && !isDraggedHere && (
                <div
                  onPointerDown={(e) => startDrag(e, pid)}
                  draggable={false}
                  className={`w-[100%] h-[100%] ${
                    (color === "white" && pid < 16) ||
                    (color === "black" && pid >= 16)
                      ? "cursor-not-allowed"
                      : "cursor-grab"
                  }`}
                >
                  {/* <span className="absolute">{displayIndex}</span> */}
                  {/* Black Pieces */}
                  {pid >= 8 && pid <= 15 && (
                    <img src="./pieces/pawn-b.svg" alt="P" />
                  )}
                  {(pid === 0 || pid === 7) && (
                    <img src="./pieces/rook-b.svg" alt="P" />
                  )}
                  {(pid === 1 || pid === 6) && (
                    <img src="./pieces/knight-b.svg" alt="P" />
                  )}
                  {(pid === 2 || pid === 5) && (
                    <img src="./pieces/bishop-b.svg" alt="P" />
                  )}
                  {pid === 3 && <img src="./pieces/queen-b.svg" alt="P" />}
                  {pid === 4 && <img src="./pieces/king-b.svg" alt="P" />}
                  {/* White Pieces */}
                  {pid >= 16 && pid <= 23 && (
                    <img src="./pieces/pawn-w.svg" alt="P" />
                  )}
                  {(pid === 24 || pid === 31) && (
                    <img src="./pieces/rook-w.svg" alt="P" />
                  )}
                  {(pid === 25 || pid === 30) && (
                    <img src="./pieces/knight-w.svg" alt="P" />
                  )}
                  {(pid === 26 || pid === 29) && (
                    <img src="./pieces/bishop-w.svg" alt="P" />
                  )}
                  {pid === 27 && <img src="./pieces/queen-w.svg" alt="P" />}
                  {pid === 28 && <img src="./pieces/king-w.svg" alt="P" />}
                  {/* <img src="./pieces/bishop-w.svg" alt="B" /> */}
                </div>
              )}
            </div>
          );
        })}

        {/* Floating dragged piece */}
        {draggingId !== null && floatingPos && (
          <DraggingPiece
            draggingId={draggingId}
            setDraggingId={setDraggingId}
            floatingPos={floatingPos}
            setFloatingPos={setFloatingPos}
            cellSize={cellSize}
            boardRef={boardRef}
            pieceLocations={pieceLocations}
            setPieceLocations={setPieceLocations}
            history={history}
            setHistory={setHistory}
            socket={socket}
          />
        )}
      </div>
    </div>
  );
}
