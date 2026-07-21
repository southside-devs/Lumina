import React from "react";

export default function Table({ headers, data, renderRow }) {
  return (
    <table className="lumina-table">
      <thead>
        <tr>
          {headers.map((h, i) => <th key={i}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => renderRow ? renderRow(row, i) : (
          <tr key={i}>
            {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
