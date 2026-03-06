"use client";

import { useUser } from "@clerk/nextjs";
import React from "react";
import { useUserData } from "../contexts/UserDataContext";

export default function SyncUser() {
  const { user } = useUser();
  const { setUserData } = useUserData();
  console.log("SyncUser component mounted", user);

  React.useEffect(() => {
    async function Sync() {
      if (user) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/sync-user`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerkId: user.id,
              username: user.username,
              email: user.primaryEmailAddress?.emailAddress,
              profilePhoto: user.imageUrl,
            }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error syncing user:", errorData);
          return;
        }
        const data = await response.json();
        console.log("***************user data: ", data.user);
        setUserData(data.user);
      }
    }
    Sync();
  }, [user]);

  return null;
}
