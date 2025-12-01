export function formatTable(headers: string[], rows: string[][]): string[] {
  if (rows.length === 0) {
    return ["No data available."];
  }

  // Calculate column widths
  const widths = headers.map((header, i) => {
    const headerWidth = header.length;
    const maxRowWidth = Math.max(...rows.map(row => (row[i] || "").length));
    return Math.max(headerWidth, maxRowWidth, 3);
  });

  const lines: string[] = [];
  
  // Top border
  const topBorder = "┌" + widths.map(w => "─".repeat(w + 2)).join("┬") + "┐";
  lines.push(topBorder);
  
  // Header
  const headerRow = "│ " + headers.map((h, i) => h.padEnd(widths[i])).join(" │ ") + " │";
  lines.push(headerRow);
  
  // Header separator
  const separator = "├" + widths.map(w => "─".repeat(w + 2)).join("┼") + "┤";
  lines.push(separator);
  
  // Rows
  for (const row of rows) {
    const rowText = "│ " + row.map((cell, i) => (cell || "").padEnd(widths[i])).join(" │ ") + " │";
    lines.push(rowText);
  }
  
  // Bottom border
  const bottomBorder = "└" + widths.map(w => "─".repeat(w + 2)).join("┴") + "┘";
  lines.push(bottomBorder);
  
  return lines;
}

export function formatMessage(message: {
  sender: string;
  content: string;
  timestamp: string;
  isOwn?: boolean;
}): string {
  const time = new Date(message.timestamp).toLocaleTimeString();
  const prefix = message.isOwn ? "→" : "←";
  return `[${time}] ${prefix} ${message.sender}: ${message.content}`;
}

export function createBanner(text: string): string[] {
  const lines = text.split("\n");
  const maxWidth = Math.max(...lines.map(l => l.length));
  const border = "═".repeat(maxWidth + 4);
  
  return [
    border,
    ...lines.map(line => `  ${line.padEnd(maxWidth)}  `),
    border,
  ];
}

export function formatError(message: string): string {
  return `❌ Error: ${message}`;
}

export function formatSuccess(message: string): string {
  return `✓ ${message}`;
}

export function formatInfo(message: string): string {
  return `ℹ ${message}`;
}

