import Card from "../common/Card";
import "../../styles/dashboard.css";

export default function KPIWidget({

    title,

    value,

    change,

    icon,

    color = "#3b82f6"

}) {

    const positive = change >= 0;

    return (

        <Card className="kpi-widget" padding={false}>

            <div className="kpi-content">

                <div>

                    <p className="kpi-title">

                        {title}

                    </p>

                    <h2 className="kpi-value">

                        {value}

                    </h2>

                    <span
                        className={
                            positive
                                ? "kpi-change positive"
                                : "kpi-change negative"
                        }
                    >

                        {positive ? "+" : ""}

                        {change}%

                    </span>

                </div>

                <div
                    className="kpi-icon"
                    style={{
                        background: color
                    }}
                >

                    {icon}

                </div>

            </div>

        </Card>

    );

}