import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isLoggedIn, isAdmin, loading, token } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!loading && (!isLoggedIn || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to access this page.",
        variant: "destructive",
      });
    }
  }, [loading, isLoggedIn, isAdmin, toast]);

  // Show loading state while authentication is being verified
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Verifying authentication...</span>
      </div>
    );
  }

  // Redirect to login if user is not logged in
  if (!isLoggedIn || !token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Redirect to home if user is not an admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and admin, render the children components
  return <>{children}</>;
};

export default AdminRoute;
