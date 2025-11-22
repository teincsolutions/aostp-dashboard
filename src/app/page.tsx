"use client";

import { Spin } from "antd";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const { isAuthenticated, isHydrated } = useAuthStore();

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
