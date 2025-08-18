"use client";

import React, { useRef, useMemo, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";

// Board square component
interface BoardSquareProps {
  position: [number, number, number];
  dark: boolean;
}

function BoardSquare({ position, dark }: BoardSquareProps) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial color={dark ? "#769656" : "#eeeed2"} />
    </mesh>
  );
}

// Chess piece component
interface ChessPieceProps {
  position: [number, number, number];
  color?: "white" | "black";
  type?: string; // you could extend this to strict union types for piece types
}

function ChessPiece({ position, color = "white" }: ChessPieceProps) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
        <meshStandardMaterial
          color={color === "white" ? "#f5f5f5" : "#222"}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color={color === "white" ? "#f5f5f5" : "#222"}
          metalness={0.3}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

// Chessboard with squares & pieces
interface ChessBoardProps {
  boardSize?: number;
}

function ChessBoard({ boardSize = 8 }: ChessBoardProps) {
  const squares = useMemo(() => {
    const arr: { key: string; pos: [number, number, number]; dark: boolean }[] =
      [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const x = c - (boardSize - 1) / 2;
        const z = r - (boardSize - 1) / 2;
        const dark = (r + c) % 2 === 1;
        arr.push({ key: `${r}-${c}`, pos: [x, 0, z], dark });
      }
    }
    return arr;
  }, [boardSize]);

  const pieces = useMemo(() => {
    const p: { pos: [number, number, number]; color: "white" | "black" }[] = [];
    for (let c = 0; c < boardSize; c++) {
      const x = c - (boardSize - 1) / 2;
      p.push({ pos: [x, 0.2, -(boardSize - 1) / 2 + 1], color: "white" });
      p.push({ pos: [x, 0.2, (boardSize - 1) / 2 - 1], color: "black" });
    }
    return p;
  }, [boardSize]);

  return (
    <group>
      {squares.map((s) => (
        <BoardSquare key={s.key} position={s.pos} dark={s.dark} />
      ))}

      {/* border */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[boardSize + 0.5, 0.1, boardSize + 0.5]} />
        <meshStandardMaterial
          color={"#5a3e2b"}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* pieces */}
      {pieces.map((pc, idx) => (
        <ChessPiece key={idx} position={pc.pos} color={pc.color} />
      ))}
    </group>
  );
}

// UI hint component
function RightClickInstructions() {
  return (
    <Html center distanceFactor={8} occlude>
      <div
        style={{
          padding: 8,
          background: "rgba(255,255,255,0.9)",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        Right-click & drag to rotate the board • Scroll to zoom • Middle-click /
        Shift+Right-drag to pan
      </div>
    </Html>
  );
}

// Main component
export default function ChessBoard3D() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    function onContext(e: MouseEvent) {
      e.preventDefault();
    }
    window.addEventListener("contextmenu", onContext);
    return () => window.removeEventListener("contextmenu", onContext);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas shadows camera={{ position: [0, 8, 10], fov: 40 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
        <Suspense fallback={null}>
          <ChessBoard />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          makeDefault
        />

        <RightClickInstructions />
      </Canvas>

      <div className="absolute top-4 left-4 text-white p-2 space-x-2">
        <button
          className="bg-white text-gray-800 px-3 py-1 rounded shadow"
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset();
            }
          }}
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
