"use client";

import { useUser } from "@clerk/nextjs";
import React from "react";

export default function SyncUser() {
  const { user } = useUser();

  console.log("SyncUser component mounted", user);

  React.useEffect(() => {
    if (user) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sync-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          username: user.username,
          email: user.primaryEmailAddress?.emailAddress,
          profilePhoto: user.imageUrl,
        }),
      });
    }
  }, [user]);

  return null;
}
