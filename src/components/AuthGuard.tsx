"use client";

import React, { use, useEffect, useState } from "react";
import { Spin } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { usePathname } from "next/navigation";
import { ref } from "yup";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRoles,
}) => {
  const { user, isAuthenticated, refreshToken } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      // Store the current path for redirect after login
      if (pathname && pathname !== "/login") {
        localStorage.setItem("redirectAfterLogin", pathname);
      }

      redirect("/login");
    }
    setLoading(false);
  }, [isAuthenticated, pathname, loading]);

  // Refresh token if close to expiry
  useEffect(() => {
    if (isAuthenticated) {
      refreshToken();
    }
  }, [isAuthenticated, refreshToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Check role-based access if required roles are specified
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex justify-center items-center min-h-screen flex-col gap-4">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-gray-600">
          You don&apos;t have permission to access this page.
        </p>
        <p className="text-sm text-gray-500">
          Required roles: {requiredRoles.join(", ")}
        </p>
        <p className="text-sm text-gray-500">Your role: {user.role}</p>
      </div>
    );
  }

  return <>{children}</>;
};
