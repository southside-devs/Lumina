import "../../styles/components.css";

const COLORS = {

    success: "success",

    warning: "warning",

    danger: "danger",

    info: "info",

    neutral: "neutral"

};

export default function Badge({

    children,

    color = "neutral"

}) {

    return (

        <span
            className={`lumina-badge lumina-badge-${COLORS[color]}`}
        >

            {children}

        </span>

    );

}