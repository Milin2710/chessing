import React, { useEffect, useState } from "react";

export default function PairingOverlay() {
  return (
    <div className="bg-white p-4 rounded">
      <div className="flex items-center mb-4 gap-2">
        <img src="./pairing.gif" alt="Pairing" />
        <h2 className="text-xl font-bold">Pairing...</h2>
      </div>
      <p>Please wait while we find an opponent for you.</p>
    </div>
  );
}
