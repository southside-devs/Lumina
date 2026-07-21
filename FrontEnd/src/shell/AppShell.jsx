import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import StatusBar from "./StatusBar";

export default function AppShell() {
    return (
        <div className="app-shell">

            <Topbar />

            <div className="desktop-body">

                <Sidebar />

                <Workspace />

            </div>

            <StatusBar />

        </div>
    );
}