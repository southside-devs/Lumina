import "../../styles/components.css";

export default function Card({

    title,

    subtitle,

    actions,

    children,

    padding = true,

    height,

    className = ""

}) {

    return (

        <section
            className={`lumina-card ${className}`}
            style={{
                height
            }}
        >

            {(title || subtitle || actions) && (

                <div className="lumina-card-header">

                    <div>

                        {title && (

                            <h3 className="lumina-card-title">

                                {title}

                            </h3>

                        )}

                        {subtitle && (

                            <p className="lumina-card-subtitle">

                                {subtitle}

                            </p>

                        )}

                    </div>

                    {actions && (

                        <div>

                            {actions}

                        </div>

                    )}

                </div>

            )}

            <div
                className={
                    padding
                        ? "lumina-card-body"
                        : ""
                }
            >

                {children}

            </div>

        </section>

    );

}