import Image from "next/image";
import ChessBoard3D from "./components/ChessBoard3D";
import ChessBoard2D from "./components/ChessBoard2D";
import HandshakeAnimation from "./components/2DChessComponents/HandShake";

export default function Home() {
  return (
    <>
      {/* <ChessBoard3D /> */}
      <ChessBoard2D />
      {/* <HandshakeAnimation /> */}
    </>
  );
}
