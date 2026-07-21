import { Routes, Route, Navigate } from "react-router-dom";
import { routes } from "../router/routes";

export default function Workspace() {
    return (
        <main className="workspace">
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Routes>
        </main>
    );
}