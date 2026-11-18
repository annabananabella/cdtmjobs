import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Imprint from "./pages/Imprint";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PostJob from "./pages/PostJob";
import Newsletter from "./pages/Newsletter";
import Unsubscribe from "./pages/Unsubscribe";
import ReactivateJob from "./pages/ReactivateJob";
import NotFound from "./pages/NotFound";
import AdminNewsletters from "./pages/AdminNewsletters";
import AdminReview from "./pages/AdminReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/imprint" element={<Imprint />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/reactivate-job" element={<ReactivateJob />} />
          <Route path="/admin/review" element={<AdminReview />} />
          <Route path="/admin/newsletters" element={<AdminNewsletters />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
