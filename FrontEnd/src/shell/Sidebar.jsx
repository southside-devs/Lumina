import { NavLink } from "react-router-dom";
import { routes } from "../router/routes";

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                LUMINA
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "20px" }}>
                {routes.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        style={({ isActive }) => ({
                            display: "block",
                            padding: "10px 16px",
                            color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                            backgroundColor: isActive ? "var(--bg-hover)" : "transparent",
                            borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                            textDecoration: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            transition: "all 0.2s"
                        })}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}