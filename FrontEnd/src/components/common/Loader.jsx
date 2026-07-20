import "../../styles/components.css";

export default function Loader({

    text = "Loading..."

}) {

    return (

        <div className="lumina-loader">

            <div className="lumina-spinner"></div>

            <p>{text}</p>

        </div>

    );

}