import "../../styles/dashboard.css";

export default function PanelCard({

    title,

    children,

    footer

}) {

    return (

        <section className="panel-card">

            <header className="panel-header">

                <h3>

                    {title}

                </h3>

            </header>

            <div className="panel-body">

                {children}

            </div>

            {footer && (

                <footer className="panel-footer">

                    {footer}

                </footer>

            )}

        </section>

    );

}