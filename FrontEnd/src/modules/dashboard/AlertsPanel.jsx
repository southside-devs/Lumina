import Badge from "../../components/common/Badge";
import PanelCard from "../../components/cards/PanelCard";

const alerts = [

    {
        id: 1,
        level: "danger",
        title: "High Crime Cluster",
        location: "Bengaluru South"
    },

    {
        id: 2,
        level: "warning",
        title: "Repeat Offender Detected",
        location: "Mysuru"
    },

    {
        id: 3,
        level: "info",
        title: "New FIR Uploaded",
        location: "Tumakuru"
    }

];

export default function AlertsPanel() {

    return (

        <PanelCard title="Critical Alerts">

            <div className="alerts-list">

                {alerts.map((alert) => (

                    <div
                        key={alert.id}
                        className="alert-item"
                    >

                        <div>

                            <h4>{alert.title}</h4>

                            <p>{alert.location}</p>

                        </div>

                        <Badge color={alert.level}>

                            {alert.level.toUpperCase()}

                        </Badge>

                    </div>

                ))}

            </div>

        </PanelCard>

    );

}