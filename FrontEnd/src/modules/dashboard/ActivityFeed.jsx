import PanelCard from "../../components/cards/PanelCard";
import useDashboard from "../../hooks/useDashboard";

export default function ActivityFeed(){

    const {

        activities

    } = useDashboard();

    return(

        <PanelCard title="Recent Activity">

            <div className="activity-feed">

                {activities.map(activity=>(

                    <div
                        key={activity.id}
                        className="activity-item"
                    >

                        <div className="activity-dot"/>

                        <div className="activity-content">

                            <strong>

                                {activity.officer}

                            </strong>

                            <p>

                                {activity.action}

                            </p>

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