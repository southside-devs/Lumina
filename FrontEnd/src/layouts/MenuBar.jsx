import { MENU } from "../constants/menu";

export default function MenuBar() {
    return (
        <div className="menu-bar">
            {MENU.map(item => (
                <button
                    key={item}
                    className="menu-button"
                >
                    {item}
                </button>
            ))}
        </div>
    );
}