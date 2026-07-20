import "../../styles/components.css";

export default function Input({
    label,
    placeholder = "",
    value,
    onChange,
    type = "text",
    disabled = false,
    error = "",
    required = false
}) {

    return (

        <div className="lumina-input-group">

            {label && (

                <label className="lumina-input-label">

                    {label}

                    {required && (
                        <span className="lumina-required">*</span>
                    )}

                </label>

            )}

            <input
                className={`lumina-input ${error ? "lumina-input-error" : ""}`}
                type={type}
                value={value}
                disabled={disabled}
                placeholder={placeholder}
                onChange={onChange}
            />

            {error && (

                <span className="lumina-error-text">

                    {error}

                </span>

            )}

        </div>

    );

}