import Button from "../../components/common/Button";
import useDashboard from "../../hooks/useDashboard";

export default function DashboardHeader() {

    const { refresh, loading } = useDashboard();

    return (

        <header className="dashboard-header">

            <div>

                <h1 className="dashboard-title">

                    Crime Intelligence Dashboard

                </h1>

                <p className="dashboard-subtitle">

                    Karnataka State Police Intelligence Platform

                </p>

            </div>

            <div className="dashboard-actions">

                <Button
                    variant="secondary"
                    onClick={refresh}
                    disabled={loading}
                >

                    {loading ? "Refreshing..." : "Refresh"}

                </Button>

                <Button>

                    Export

                </Button>

            </div>

        </header>

    );

}