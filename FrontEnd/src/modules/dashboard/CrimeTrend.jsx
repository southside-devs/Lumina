import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

import InfoCard from "../../components/cards/InfoCard";
import useDashboard from "../../hooks/useDashboard";

export default function CrimeTrend() {

    const {

        crimeTrend

    } = useDashboard();

    return (

        <InfoCard
            title="Crime Trend"
            subtitle="Last 7 Days"
        >

            <div className="chart-container">

                <ResponsiveContainer
                    width="100%"
                    height={300}
                >

                    <LineChart data={crimeTrend}>

                        <CartesianGrid stroke="#243142"/>

                        <XAxis
                            dataKey="day"
                            stroke="#9ca3af"
                        />

                        <YAxis
                            stroke="#9ca3af"
                        />

                        <Tooltip/>

                        <Line
                            dataKey="crimes"
                            stroke="#3b82f6"
                            strokeWidth={3}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

        </InfoCard>

    );

}