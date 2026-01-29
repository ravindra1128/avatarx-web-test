import DashboardHeader from "./components/dashboard/Header";
import Sidebar from "./components/dashboard/Sidebar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="w-full">
      <DashboardHeader />
      <div className="flex min-h-screen w-full bg-[#f4f8f9]">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
