// Import Dependencies
import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
      staleTime: 1000 * 60, // 60s — matches original frontend
    },
  },
});

function App() {
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
