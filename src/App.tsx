import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// ─── User (Public) Pages ───────────────────────────────────────────────────
import Home from "@/pages/user/home";
import Products from "@/pages/user/products";
import ProductDetail from "@/pages/user/product-detail";
import Gallery from "@/pages/user/gallery";
import MapPage from "@/pages/user/map";
import AboutPage from "@/pages/user/about";
import Register from "@/pages/user/register";
import NotFound from "@/pages/user/not-found";

// ─── Admin Pages ───────────────────────────────────────────────────────────
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCategories from "@/pages/admin/categories";
import AdminProducts from "@/pages/admin/products";
import AdminMedia from "@/pages/admin/media";
import AdminRegistrations from "@/pages/admin/registrations";
import AdminLogs from "@/pages/admin/logs";
import AdminUsers from "@/pages/admin/users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

function Router() {
  return (
    <Switch>
      {/* ── Public Routes ─────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/map" component={MapPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/register" component={Register} />

      {/* ── Admin Routes ─────────────────────────────── */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/registrations" component={AdminRegistrations} />
      <Route path="/admin/logs" component={AdminLogs} />
      <Route path="/admin/users" component={AdminUsers} />

      {/* ── 404 ──────────────────────────────────────── */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
