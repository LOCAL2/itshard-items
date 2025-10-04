import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import Manager from "./pages/Manager";
import NavBar from "./components/NavBar";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { 
      path: "/", 
      element: (
        <>
          <NavBar />
          <Index />
        </>
      ) 
    },
    { 
      path: "/manager", 
      element: (
        <>
          <NavBar />
          <Manager />
        </>
      ) 
    },
    { 
      path: "*", 
      element: (
        <>
          <NavBar />
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-muted-foreground">ไม่พบหน้าที่คุณต้องการ</p>
            </div>
          </div>
        </>
      ) 
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
