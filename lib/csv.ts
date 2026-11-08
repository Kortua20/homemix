// CSV serialization shared by the public feeds (app/prices.csv, app/api/meta-feed.csv).

// RFC 4180: quote a field containing a comma, quote, CR or LF; double embedded quotes.
function escapeCsvField(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Rows joined with CRLF, as RFC 4180 specifies, with a trailing line break.
export function toCsv(rows: string[][]) {
  return (
    rows.map((fields) => fields.map(escapeCsvField).join(",")).join("\r\n") +
    "\r\n"
  );
}
