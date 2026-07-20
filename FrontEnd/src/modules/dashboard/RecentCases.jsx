import PanelCard from "../../components/cards/PanelCard";
import Badge from "../../components/common/Badge";
import useDashboard from "../../hooks/useDashboard";

function getColor(status){

    switch(status){

        case "Closed":

            return "success";

        case "Investigating":

            return "warning";

        default:

            return "danger";

    }

}

export default function RecentCases(){

    const {

        recentCases

    } = useDashboard();

    return(

        <PanelCard title="Recent FIR Cases">

            <table className="cases-table">

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>District</th>

                        <th>Type</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {recentCases.map((item)=>(

                        <tr key={item.id}>

                            <td>

                                {item.id}

                            </td>

                            <td>

                                {item.district}

                            </td>

                            <td>

                                {item.type}

                            </td>

                            <td>

                                <Badge color={getColor(item.status)}>

                                    {item.status}

                                </Badge>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </PanelCard>

    );

}