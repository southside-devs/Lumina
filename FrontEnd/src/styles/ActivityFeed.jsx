import PanelCard from "../../components/cards/PanelCard";

const activities = [
    {
        id: 1,
        officer: "Inspector Raj",
        action: "Closed FIR #FIR-2026-1023",
        time: "5 mins ago"
    },
    {
        id: 2,
        officer: "SI Kavya",
        action: "Added new accused profile",
        time: "18 mins ago"
    },
    {
        id: 3,
        officer: "ACP Naveen",
        action: "Updated hotspot analysis",
        time: "42 mins ago"
    },
    {
        id: 4,
        officer: "Constable Arun",
        action: "Uploaded CCTV evidence",
        time: "1 hour ago"
    }
];

export default function ActivityFeed() {

    return (

        <PanelCard title="Recent Activity">

            <div className="activity-feed">

                {activities.map((activity) => (

                    <div
                        key={activity.id}
                        className="activity-item"
                    >

                        <div className="activity-dot"></div>

                        <div className="activity-content">

                            <strong>{activity.officer}</strong>

                            <p>{activity.action}</p>

                        </div>

                        <span className="activity-time">

                            {activity.time}

                        </span>

                    </div>

                ))}

            </div>

        </PanelCard>

    );

}