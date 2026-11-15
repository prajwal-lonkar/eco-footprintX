/**
 * Generic, reusable CSV parser utility.
 *
 * Handles standard CSV rules:
 *  - Comma-separated values
 *  - Quoted fields (may contain commas or newlines)
 *  - Escaped double-quotes inside quoted fields ("")
 *  - CRLF and LF line endings
 *
 * Usage:
 *   const result = parseCsv<MyRow>(fileBuffer, {
 *     requiredHeaders: ['Email', 'isActive'],
 *     transform: (row) => ({ email: row['Email'], isActive: row['isActive'] === 'true' }),
 *   });
 */

export interface CsvParseOptions<T = Record<string, string>> {
  /** Headers that must be present in the CSV file. Returns an error if any are missing. */
  requiredHeaders: string[];

  /**
   * Optional transform applied to each raw row (all values are strings at this stage).
   * Throw an Error inside this function to record a per-row parse error and skip the row.
   */
  transform?: (row: Record<string, string>, rowIndex: number) => T;
}

export interface CsvParseResult<T = Record<string, string>> {
  /** Successfully parsed (and optionally transformed) rows. */
  rows: T[];
  /** Non-fatal per-row errors. Row-level errors skip the row but do not abort parsing. */
  errors: string[];
  /** Total number of data rows (excluding the header). */
  totalRows: number;
}

/**
 * Parse a CSV buffer or string into typed rows.
 *
 * @param input  Raw CSV content as a Buffer or string.
 * @param options  Required headers and optional row transform.
 * @returns Parsed rows, per-row errors, and total data-row count.
 */
export function parseCsv<T = Record<string, string>>(
  input: Buffer | string,
  options: CsvParseOptions<T>,
): CsvParseResult<T> {
  const content = Buffer.isBuffer(input) ? input.toString('utf-8') : input;

  // Remove BOM if present (Excel sometimes adds it)
  const normalized = content.replace(/^\uFEFF/, '');

  const lines = normalized
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { rows: [], errors: ['CSV file is empty'], totalRows: 0 };
  }

  const headers = parseCsvRow(lines[0]);

  const missingHeaders = options.requiredHeaders.filter(
    (h) => !headers.includes(h),
  );
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required headers: ${missingHeaders.join(', ')}. Found: ${headers.join(', ')}`,
      ],
      totalRows: 0,
    };
  }

  const rows: T[] = [];
  const errors: string[] = [];
  const dataLines = lines.slice(1);

  dataLines.forEach((line, index) => {
    const rowNumber = index + 2; // 1-based, row 1 is the header
    const values = parseCsvRow(line);

    if (values.length !== headers.length) {
      errors.push(
        `Row ${rowNumber}: column count mismatch (expected ${headers.length}, got ${values.length})`,
      );
      return;
    }

    const rawRow: Record<string, string> = {};
    headers.forEach((header, i) => {
      rawRow[header] = values[i];
    });

    if (options.transform) {
      try {
        rows.push(options.transform(rawRow, rowNumber));
      } catch (err: any) {
        errors.push(`Row ${rowNumber}: ${err.message}`);
      }
    } else {
      rows.push(rawRow as unknown as T);
    }
  });

  return { rows, errors, totalRows: dataLines.length };
}

/**
 * Parse a single CSV line into an array of field values.
 * Handles quoted fields and escaped double-quotes.
 */
function parseCsvRow(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          // Escaped quote inside a quoted field
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current.trim());
  return values;
}
