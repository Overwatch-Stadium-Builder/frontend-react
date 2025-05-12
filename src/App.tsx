import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { IndexPage } from "./pages";
import { NotFound } from "./pages";
import { Login } from "./pages";
import { Register } from "./pages";
import { BuildCreate } from "./pages";
import { BuildView } from "./pages";
import { HeroPage } from "./pages";
import { Profile } from "./pages";
import { Admin } from "./pages";
import { AdminBuilds } from "./pages";
import { AdminItemPowers } from "./pages";
import { Status } from "./pages";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import SearchResults from "./pages/SearchResults";
import LinkWrapper from "./components/LinkWrapper";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LinkWrapper>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<IndexPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/hero/:heroId" element={<HeroPage />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/status" element={<Status />} />
                  <Route path="/create-build" element={
                    <ProtectedRoute>
                      <BuildCreate />
                    </ProtectedRoute>
                  } />
                  <Route path="/build/:id" element={<BuildView />} />
                  <Route path="/edit-build/:id" element={
                    <ProtectedRoute>
                      <BuildView isEditing={true} />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin" element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } />
                  <Route path="/admin/builds" element={
                    <AdminRoute>
                      <AdminBuilds />
                    </AdminRoute>
                  } />
                  <Route path="/admin/items-powers" element={
                    <AdminRoute>
                      <AdminItemPowers />
                    </AdminRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </LinkWrapper>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
