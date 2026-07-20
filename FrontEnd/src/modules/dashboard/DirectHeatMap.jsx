import PanelCard from "../../components/cards/PanelCard";
import useDashboard from "../../hooks/useDashboard";

export default function DistrictHeatMap() {

    const {

        districts

    } = useDashboard();

    return (

        <PanelCard title="District Activity">

            <div className="district-grid">

                {districts.map((district)=>(

                    <div
                        key={district.id}
                        className="district-card"
                    >

                        <h4>

                            {district.name}

                        </h4>

                        <span>

                            {district.risk}

                        </span>

                    </div>

                ))}

            </div>

        </PanelCard>

    );

}