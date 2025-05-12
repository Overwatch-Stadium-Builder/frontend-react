import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const { isAdmin, token } = useAuth();

  // Check if user is admin
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You must be logged in as an admin to view this page.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    setLoading(false);
  }, [navigate, toast]);

  const adminModules = [
    {
      title: "Manage Builds",
      description: "Verify user builds and manage existing ones",
      icon: Check,
      route: "/admin/builds",
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Manage Items & Powers",
      description: "Add, edit, and delete items and powers",
      icon: Plus,
      route: "/admin/items-powers",
      color: "bg-blue-100 text-blue-700"
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center h-64">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage the Overwatch Stadium Build Arena</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminModules.map((module) => (
          <Card 
            key={module.title}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(module.route)}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${module.color}`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Admin;
