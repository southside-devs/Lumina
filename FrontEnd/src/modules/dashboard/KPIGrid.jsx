import { KPIWidget } from "../../components/cards";
import useDashboard from "../../hooks/useDashboard";

export default function KPIGrid() {

    const { kpis } = useDashboard();

    return (

        <section className="dashboard-kpi-grid">

            {kpis.map((item) => {

                const Icon = item.icon;

                return (

                    <KPIWidget
                        key={item.id}
                        title={item.title}
                        value={item.value}
                        change={item.change}
                        color={item.color}
                        icon={<Icon size={24} />}
                    />

                );

            })}

        </section>

    );

}