import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import DatabaseService from '@/services/DatabaseService';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userId: number | null;
  username: string | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  verifyToken: () => Promise<boolean>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isAdmin: false,
  userId: null,
  username: null,
  token: null,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  loading: true,
  verifyToken: async () => false
});

// Export the context hook as a named function declaration
export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const db = DatabaseService.getInstance();

  // Initialize auth state from session storage
  useEffect(() => {
    const storedToken = sessionStorage.getItem('authToken');
    const storedUserId = sessionStorage.getItem('userId');
    const storedUsername = sessionStorage.getItem('username');
    const storedIsAdmin = sessionStorage.getItem('isAdmin');

    if (storedToken && storedUserId && storedUsername) {
      setIsLoggedIn(true);
      setUserId(Number(storedUserId));
      setUsername(storedUsername);
      setIsAdmin(storedIsAdmin === 'true');
      setToken(storedToken);
      
      // Verify token is still valid with backend
      verifyToken();
    } else {
      setIsLoggedIn(false);
      setUserId(null);
      setUsername(null);
      setIsAdmin(false);
      setToken(null);
    }
    
    setLoading(false);
  }, []);

  const verifyToken = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await db.verifyToken();
      
      if (!isValid) {
        setIsLoggedIn(false);
        setUserId(null);
        setUsername(null);
        setIsAdmin(false);
        setToken(null);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }, [db]);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch('https://owapi.luciousdev.nl/api/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        // Token is invalid, clear auth state
        logout();
        return;
      }

      const data = await response.json();
      setUserId(data.id);
      setUsername(data.username);
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error verifying token:', error);
      // Network error, but don't log out since the user might be offline temporarily
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch('https://owapi.luciousdev.nl/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.error || "Invalid username or password",
          variant: "destructive"
        });
        return false;
      }

      const data = await response.json();
      
      // Save auth data in session storage
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('userId', data.id.toString());
      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('isAdmin', data.isAdmin.toString());
      
      // Update state
      setIsLoggedIn(true);
      setUserId(data.id);
      setUsername(data.username);
      setIsAdmin(data.isAdmin);
      setToken(data.token);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.username}!`
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Unable to connect to the server",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, confirmPassword: string): Promise<boolean> => {
    if (password !== confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      const response = await fetch('https://owapi.luciousdev.nl/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Registration failed",
          description: error.error || "Username may already be taken",
          variant: "destructive"
        });
        return false;
      }

      const data = await response.json();
      
      // Save auth data in session storage
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('userId', data.id.toString());
      sessionStorage.setItem('username', data.username);
      sessionStorage.setItem('isAdmin', 'false');
      
      // Update state
      setIsLoggedIn(true);
      setUserId(data.id);
      setUsername(data.username);
      setIsAdmin(false);
      setToken(data.token);
      
      toast({
        title: "Registration successful",
        description: "Welcome to Stadium Builder!"
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: "Unable to connect to the server",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if we have a token
      if (token) {
        await fetch('https://owapi.luciousdev.nl/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session storage and state regardless of API success
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('isAdmin');
      
      setIsLoggedIn(false);
      setUserId(null);
      setUsername(null);
      setIsAdmin(false);
      setToken(null);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully"
      });
    }
  };

  const value = {
    isLoggedIn,
    isAdmin,
    userId,
    username,
    token,
    login,
    register,
    logout,
    loading,
    verifyToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
