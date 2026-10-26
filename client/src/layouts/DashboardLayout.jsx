import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { AlertasGerencialesProvider } from "../context/AlertasGerencialesContext";

function DashboardLayout({ children }) {
  return (
    <AlertasGerencialesProvider>
    <div className="min-h-screen bg-nx-bg">

      <div className="flex">

        <Sidebar />

        <div className="flex-1 min-w-0">

          <Topbar />

          <main className="animate-fade-in motion-reduce:animate-none mx-auto max-w-[1400px] p-6">
            {children}
          </main>

        </div>

      </div>

    </div>
    </AlertasGerencialesProvider>
  );
}

export default DashboardLayout;
