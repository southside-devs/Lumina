import Card from "../common/Card";
import "../../styles/dashboard.css";

export default function InfoCard({

    title,

    subtitle,

    children,

    actions

}) {

    return (

        <Card
            title={title}
            subtitle={subtitle}
            actions={actions}
        >

            {children}

        </Card>

    );

}