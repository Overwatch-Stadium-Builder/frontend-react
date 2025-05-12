import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { isLoggedIn, isAdmin, username, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <span className="hidden md:inline-block ml-2 text-xl font-bold">
              Stadium Build Builder
            </span>
          </Link>
        </div>
        
        <div className="hidden md:flex flex-1 mx-4 lg:mx-8">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Input
              type="search"
              placeholder="Search builds..."
              className="pr-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>

        <nav className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button variant="outline" onClick={() => navigate("/create-build")}>
                Create Build
              </Button>
              {isAdmin && (
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  Admin
                </Button>
              )}
              <div className="hidden sm:block text-sm mr-2">
                Hello, {username}
              </div>
              <Button variant="ghost" onClick={() => navigate("/profile")}>
                Profile
              </Button>
              <Button variant="destructive" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="default" onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
