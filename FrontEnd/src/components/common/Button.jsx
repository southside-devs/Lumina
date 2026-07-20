import "../../styles/components.css";

export default function Button({
    children,
    variant = "primary",
    size = "md",
    icon = null,
    disabled = false,
    fullWidth = false,
    onClick,
    type = "button"
}) {

    const classes = [
        "lumina-btn",
        `lumina-btn-${variant}`,
        `lumina-btn-${size}`,
        fullWidth ? "lumina-btn-full" : ""
    ].join(" ");

    return (

        <button
            type={type}
            className={classes}
            disabled={disabled}
            onClick={onClick}
        >

            {icon &&

                <span className="lumina-btn-icon">

                    {icon}

                </span>

            }

            <span>

                {children}

            </span>

        </button>

    );

}