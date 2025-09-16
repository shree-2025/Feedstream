import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <AppSidebar />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out min-h-screen ${
          isExpanded || isHovered ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        <Backdrop />
        <AppHeader />
        <div className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
          <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
            <Outlet />
          </div>
        </div>
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
