import PanelCard from "../../components/cards/PanelCard";
import Badge from "../../components/common/Badge";

const cases = [

    {
        id: "FIR-1021",
        district: "Bengaluru",
        type: "Theft",
        status: "Open"
    },

    {
        id: "FIR-1022",
        district: "Mysuru",
        type: "Assault",
        status: "Investigating"
    },

    {
        id: "FIR-1023",
        district: "Tumakuru",
        type: "Cyber Crime",
        status: "Closed"
    },

    {
        id: "FIR-1024",
        district: "Hubballi",
        type: "Robbery",
        status: "Open"
    }

];

function getStatus(status) {

    switch (status) {

        case "Closed":
            return "success";

        case "Investigating":
            return "warning";

        default:
            return "danger";

    }

}

export default function RecentCases() {

    return (

        <PanelCard title="Recent FIR Cases">

            <table className="cases-table">

                <thead>

                    <tr>

                        <th>Case ID</th>

                        <th>District</th>

                        <th>Type</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {cases.map((item) => (

                        <tr key={item.id}>

                            <td>{item.id}</td>

                            <td>{item.district}</td>

                            <td>{item.type}</td>

                            <td>

                                <Badge color={getStatus(item.status)}>

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