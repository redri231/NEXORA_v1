import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-nx-bg">

      <div className="flex">

        <Sidebar />

        <div className="flex-1 min-w-0">

          <Topbar />

          <main className="p-6 max-w-[1400px] mx-auto">
            {children}
          </main>

        </div>

      </div>

    </div>
  );
}

export default DashboardLayout;