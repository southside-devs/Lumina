import { NAVIGATION } from "../constants/navigation";

export default function Sidebar() {

    return (

        <aside className="sidebar">

            <div className="sidebar-logo">

                LUMINA

            </div>

            <nav>

                {NAVIGATION.map(item => (

                    <button
                        key={item.label}
                        className="nav-button"
                    >
                        {item.label}
                    </button>

                ))}

            </nav>

        </aside>

    );

}