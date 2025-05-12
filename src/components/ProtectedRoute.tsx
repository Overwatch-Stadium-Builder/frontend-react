import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, loading, token, userId, verifyToken } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [verifyingToken, setVerifyingToken] = useState(false);
  
  useEffect(() => {
    if (!loading && token && !verifyingToken) {
      setVerifyingToken(true);
      verifyToken().finally(() => setVerifyingToken(false));
    }
  }, [loading, token, verifyToken]);
  
  useEffect(() => {
    if (!loading && !isLoggedIn && !verifyingToken) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to access this page.",
        variant: "destructive",
      });
    }
  }, [loading, isLoggedIn, toast, verifyingToken]);

  // Additional validation that both token and userId exist
  const isAuthenticated = isLoggedIn && token && userId;

  // Show loading state while authentication is being verified
  if (loading || verifyingToken) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verifying authentication...</span>
      </div>
    );
  }

  // Redirect to login if user is not logged in or token is missing
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated, render the children components
  return <>{children}</>;
};

export default ProtectedRoute;
