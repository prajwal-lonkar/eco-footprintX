/**
 * Shared results section for "Use our Database".
 * Renders: status messages (no-results / error), results table with
 * radio selection, pagination, and header tooltips.

 */
import type { FC } from 'react';
import styles from '@pages/Dashboard/CompanyDashboard/BuiltEnviromentalProfileFlow/steps/AddImpactCategory/SelectDataSource/SelectDataSource.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import Pagination from '@common/Pagination/Pagination';
import infoIcon from '@assets/icons/info-icon.svg';
import { ERROR_MESSAGES } from '@constants/messages';
import type { ImpactDatabaseSearchResultRow } from '@type/built-enviromental-profile';
import type { ResultColumnDef } from '@constants/databaseSearchUtils';
import type { BenchmarkStatus } from '@utils/industryAvgComparison';
import IndustryAvgPlaceholderStatus from '@components/IndustryAvgPlaceholderStatus';
import { TOOLTIP_TEXT } from '@constants/tooltips';

const INDUSTRY_LABELS: Record<string, string> = {
  higher: 'Higher impact than industry average',
  similar: 'Similar impact as industry average',
  lower: 'Lower impact than industry average',
};

// Helpers

const cellVal = (row: ImpactDatabaseSearchResultRow, colKey: string) => {
  if (colKey === 'industryComparison') {
    const comp = (row as unknown as Record<string, unknown>)[colKey];
    return comp ? (INDUSTRY_LABELS[String(comp)] ?? String(comp)) : '-';
  }
  const x = (row as unknown as Record<string, unknown>)[colKey];
  return x != null ? String(x) : '-';
};

const renderCell = (row: ImpactDatabaseSearchResultRow, colKey: string) => {
  const val = cellVal(row, colKey);
  return <span className={styles.resultCellWrapped}>{val}</span>;
};

export interface DatabaseResultsSectionProps {
  searchStatus: 'idle' | 'no-results' | 'error';
  results: ImpactDatabaseSearchResultRow[];
  paginatedResults: ImpactDatabaseSearchResultRow[];
  resultColumns: ResultColumnDef[];
  selectedRowId: string | null;
  onSelectRow: (row: ImpactDatabaseSearchResultRow) => void;
  /** Unique name for the radio group (e.g. "carbonDbResult") */
  radioName: string;
  /** Server-side pagination: called with the new `skip` value */
  onPageChange: (newSkip: number) => void;
  /** Total count of results from the API */
  totalCount: number;
  /** Current skip offset */
  skip: number;
  /** Page size (limit) for pagination */
  pageSize: number;
  /** Disable interactions (e.g. when "No Impact" is checked) */
  disabled?: boolean;
  /** Industry average comparison status to display near the table header */
  industryAvgStatus?: BenchmarkStatus;
}

const DatabaseResultsSection: FC<DatabaseResultsSectionProps> = ({
  searchStatus,
  results,
  paginatedResults,
  resultColumns,
  selectedRowId,
  onSelectRow,
  radioName,
  onPageChange,
  totalCount,
  skip,
  pageSize,
  disabled = false,
  industryAvgStatus,
}) => {
  return (
    <div className={styles.searchResultsOrMessageArea}>
      {/* No results message */}
      {searchStatus === 'no-results' && (
        <div className={styles.noResultsMessage}>
          <p className={styles.errorMsg}>No Results Found.</p>
          <p className={styles.subErrorMsg}>
            {ERROR_MESSAGES.USE_OUR_DATABASE_NO_RESULTS_MESSAGE}
          </p>
        </div>
      )}

      {/* Error message */}
      {searchStatus === 'error' && (
        <div className={styles.searchError}>
          <p className={styles.errorMsg}>Error Loading Search Results</p>
          <p className={styles.subErrorMsg}>
            {ERROR_MESSAGES.USE_OUR_DATABASE_SEARCH_ERROR_MESSAGE}
          </p>
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && searchStatus === 'idle' && (
        <div
          className={`${styles.resultsSection} ${disabled ? styles.disabledSection : ''}`}
        >
          {/* Count & instruction + Industry Average Comparison */}
          <div className={styles.resultsHeaderRow}>
            <div className={styles.resultsCountWrapper}>
              <p className={styles.resultsCount}>
                Search Results
                <span>
                  {` (${totalCount} Data Point${totalCount !== 1 ? 's' : ''} found)`}
                </span>
              </p>
              <p className={styles.resultsInstruction}>
                Please select only one component or service that best reflects
                the activity your supplier performs in your supply chain.
              </p>
            </div>
            {industryAvgStatus && (
              <div className={styles.industryAvgComparisonWrapper}>
                <div className={styles.industryAvgComparisonLabel}>
                  Industry Average Comparison
                  <Tooltip
                    text={TOOLTIP_TEXT.INDUSTRY_AVERAGE_COMPARISON}
                    noTruncate
                    position="rightbottom"
                  >
                    <img
                      src={infoIcon}
                      alt=""
                      width={12}
                      height={12}
                      className={styles.tableHeaderInfoIcon}
                      aria-hidden
                    />
                  </Tooltip>
                </div>
                <IndustryAvgPlaceholderStatus status={industryAvgStatus} />
              </div>
            )}
          </div>

          {/* Table */}
          <div className={styles.resultsTableWrap}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th
                    className={styles.radioColumnHeader}
                    aria-label="Select"
                  />
                  {resultColumns.map((c) => (
                    <th
                      key={c.key}
                      className={styles.tableHeaderCell}
                      style={
                        c.width
                          ? {
                              width: c.width,
                              minWidth: c.width,
                              maxWidth: c.width,
                            }
                          : undefined
                      }
                    >
                      {c.headerTooltip ? (
                        <span className={styles.tableHeaderWithTooltip}>
                          <span>{c.label}</span>
                          <Tooltip
                            text={c.headerTooltip}
                            noTruncate
                            position="bottom"
                          >
                            <img
                              src={infoIcon}
                              alt=""
                              width={12}
                              height={12}
                              className={styles.tableHeaderInfoIcon}
                              aria-hidden
                            />
                          </Tooltip>
                        </span>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((row) => (
                  <tr
                    key={row.id}
                    className={selectedRowId === row.id ? styles.selected : ''}
                    onClick={() => !disabled && onSelectRow(row)}
                  >
                    <td
                      className={styles.radioCell}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className={styles.tableRadioLabel}>
                        <input
                          type="radio"
                          name={radioName}
                          checked={selectedRowId === row.id}
                          onChange={() => onSelectRow(row)}
                          disabled={disabled}
                          className={styles.radioInputHidden}
                        />
                        <span
                          className={styles.customTableRadio}
                          aria-hidden
                        />
                      </label>
                    </td>
                    {resultColumns.map((c) => (
                      <td
                        key={c.key}
                        style={
                          c.width
                            ? {
                                width: c.width,
                                minWidth: c.width,
                                maxWidth: c.width,
                              }
                            : undefined
                        }
                      >
                        {renderCell(row, c.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            skip={skip}
            limit={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DatabaseResultsSection;
