export default function Topbar() {
    return (
        <div className="toolbar">

            <input
                className="toolbar-search"
                placeholder="Search FIR, Accused, Case..."
            />

            <button>Refresh</button>

            <button>Export</button>

        </div>
    );
}