import MenuBar from "./MenuBar";
import Toolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import RightPanel from "./RightPanel";
import StatusBar from "./StatusBar";

export default function AppShell() {
    return (
        <div className="app-shell">

            <MenuBar />

            <Toolbar />

            <div className="desktop-body">

                <Sidebar />

                <Workspace />

                <RightPanel />

            </div>

            <StatusBar />

        </div>
    );
}