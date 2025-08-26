import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <>
        <AppSidebar />
        <Backdrop />
      </>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-64" : "lg:ml-20"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <main className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900">
          <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
