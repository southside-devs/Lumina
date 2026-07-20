import "../../styles/components.css";

export default function EmptyState({

    title = "Nothing Found",

    description = "There is currently no data available.",

    action = null

}) {

    return (

        <div className="lumina-empty">

            <div className="lumina-empty-icon">

                📂

            </div>

            <h3>

                {title}

            </h3>

            <p>

                {description}

            </p>

            {action}

        </div>

    );

}