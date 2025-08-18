import React from "react";
import { Socket } from "socket.io-client";

interface DraggingPieceProps {
  draggingId: number | null;
  setDraggingId: React.Dispatch<React.SetStateAction<number | null>>;
  floatingPos: { x: number; y: number } | null;
  setFloatingPos: React.Dispatch<
    React.SetStateAction<{ x: number; y: number } | null>
  >;
  cellSize: number;
  boardRef: React.RefObject<HTMLDivElement>;
  pieceLocations: number[];
  setPieceLocations: React.Dispatch<React.SetStateAction<number[]>>;
  history: number[][];
  setHistory: React.Dispatch<React.SetStateAction<number[][]>>;
  socket: Socket;
}

const DraggingPiece: React.FC<DraggingPieceProps> = ({
  draggingId,
  setDraggingId,
  floatingPos,
  setFloatingPos,
  cellSize,
  boardRef,
  pieceLocations,
  setPieceLocations,
  history,
  setHistory,
}) => {
  console.log(
    "DraggingPiece rendered with draggingId:",
    draggingId,
    "floatingPos:",
    floatingPos
  );

  /**
   * Called when the player starts dragging a piece
   */
  const startDrag = (e: React.PointerEvent, pieceId: number) => {
    const board = boardRef.current!;
    const rect = board.getBoundingClientRect();

    // Calculate initial position so the piece is centered under the pointer
    const x = e.clientX - rect.left - cellSize / 2;
    const y = e.clientY - rect.top - cellSize / 2;

    // Set which piece is being dragged
    setDraggingId(pieceId);

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
        copy[draggingId] = newIndex;
        // Remove any piece already at this square
        for (let i = 0; i < copy.length; i++) {
          if (copy[i] === newIndex && i !== draggingId) {
            copy[i] = -1;
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

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: floatingPos?.x,
          top: floatingPos?.y,
          width: cellSize,
          height: cellSize,
          zIndex: 50,
          pointerEvents: "none", // Ignore mouse events so squares below are interactive
        }}
      >
        <div className="w-[100%] h-[100%]">
          {/* Black Pieces */}

          {draggingId >= 8 && draggingId <= 15 && (
            <img src="./pieces/pawn-b.svg" alt="P" />
          )}
          {(draggingId === 0 || draggingId === 7) && (
            <img src="./pieces/rook-b.svg" alt="P" />
          )}
          {(draggingId === 1 || draggingId === 6) && (
            <img src="./pieces/knight-b.svg" alt="P" />
          )}
          {(draggingId === 2 || draggingId === 5) && (
            <img src="./pieces/bishop-b.svg" alt="P" />
          )}
          {draggingId === 3 && <img src="./pieces/queen-b.svg" alt="P" />}
          {draggingId === 4 && <img src="./pieces/king-b.svg" alt="P" />}
          {/* White Pieces */}
          {draggingId >= 16 && draggingId <= 23 && (
            <img src="./pieces/pawn-w.svg" alt="P" />
          )}
          {(draggingId === 24 || draggingId === 31) && (
            <img src="./pieces/rook-w.svg" alt="P" />
          )}
          {(draggingId === 25 || draggingId === 30) && (
            <img src="./pieces/knight-w.svg" alt="P" />
          )}
          {(draggingId === 26 || draggingId === 29) && (
            <img src="./pieces/bishop-w.svg" alt="P" />
          )}
          {draggingId === 27 && <img src="./pieces/queen-w.svg" alt="P" />}
          {draggingId === 28 && <img src="./pieces/king-w.svg" alt="P" />}
        </div>
      </div>
    </>
  );
};

export default DraggingPiece;
