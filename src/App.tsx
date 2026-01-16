
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ListingPage from "./pages/ListingPage";
import RoomDetails from "./pages/RoomDetails";
import OwnerRegister from "./pages/OwnerRegister";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerForgotPassword from "./pages/OwnerForgotPassword";
import OwnerDashboard from "./pages/OwnerDashboard";
import CompanyInfo from "./pages/CompanyInfo";
import Offer from "./pages/Offer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/owner/register" element={<OwnerRegister />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/forgot-password" element={<OwnerForgotPassword />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/company-info" element={<CompanyInfo />} />
          <Route path="/offer" element={<Offer />} />
          <Route path="/listing/:listingId" element={<ListingPage />} />
          <Route path="/listing/:listingId/room/:roomIndex" element={<RoomDetails />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;