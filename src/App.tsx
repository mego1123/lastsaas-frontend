// Import Dependencies
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Local Imports
import { AuthProvider } from "@/app/contexts/auth/Provider";
import { BrandingProvider } from "@/app/contexts/branding/Provider";
import { TenantProvider } from "@/app/contexts/tenant/Provider";
import { BreakpointProvider } from "@/app/contexts/breakpoint/Provider";
import { LocaleProvider } from "@/app/contexts/locale/Provider";
import { SidebarProvider } from "@/app/contexts/sidebar/Provider";
import { ThemeProvider } from "@/app/contexts/theme/Provider";
import router from "./app/router/router";

// ----------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function App() {
  // Remove the 'preload' class after first paint. This class disables all
  // CSS transitions (see base.css) to prevent the layout flash where content
  // renders full-width then animates to the sidebar-offset position.
  // We use requestAnimationFrame to ensure it runs after the browser has
  // painted the initial layout.
  useEffect(() => {
    const removePreload = () => {
      document.body.classList.remove("preload");
    };
    const rafId = requestAnimationFrame(removePreload);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <AuthProvider>
          <ThemeProvider>
            <LocaleProvider>
              <BreakpointProvider>
                <SidebarProvider>
                  <TenantProvider>
                    <RouterProvider router={router} />
                  </TenantProvider>
                </SidebarProvider>
              </BreakpointProvider>
            </LocaleProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}

export default App;
