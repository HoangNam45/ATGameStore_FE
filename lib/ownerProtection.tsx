"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./authContext";
import { isOwnerEmail } from "./firebaseClient";

interface WithOwnerProtectionProps {
  children: React.ReactNode;
}

export function withOwnerProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const ProtectedComponent = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      if (!loading) {
        if (!user) {
          // Not logged in, redirect to login
          router.push("/login");
          return;
        }

        if (!isOwnerEmail(user.email || "")) {
          // Not an owner, redirect to home
          router.push("/");
          return;
        }

        // User is owner, allow access
        setIsAuthorized(true);
      }
    }, [user, loading, router]);

    // Show loading while checking auth
    if (loading || !isAuthorized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {loading
                ? "Đang kiểm tra quyền truy cập..."
                : "Đang chuyển hướng..."}
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  ProtectedComponent.displayName = `withOwnerProtection(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ProtectedComponent;
}

// Hook to check if current user is owner
export function useIsOwner() {
  const { user, loading } = useAuth();

  return {
    isOwner: user ? isOwnerEmail(user.email || "") : false,
    loading,
  };
}

// Component for owner-only content
export function OwnerOnly({ children }: WithOwnerProtectionProps) {
  const { isOwner } = useIsOwner();

  if (!isOwner) {
    return null;
  }

  return <>{children}</>;
}
