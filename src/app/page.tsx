"use client";

import { Spin } from "antd";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated) {
      if (isAuthenticated) {
        redirect("/dashboard");
      } else {
        redirect("/login");
      }
    }
  }, [isAuthenticated, isHydrated]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}
