import { useMemo } from 'react';
import styles from './SearchResultsTableComponent.module.scss';
import Tooltip from '@common/Tooltip/Tooltip';
import infoIcon from '@assets/icons/info-icon.svg';
import { TOOLTIP_TEXT } from '@constants/tooltips';
import parentStyles from '../../../BuiltEnviromentalProfileFlow.module.scss';
import checkedIcon from '@assets/icons/checked.svg';
import checkIcon from '@assets/icons/check.svg';
import type { IndustryBenchmarkingResultItem } from '@type/built-enviromental-profile';
import { SUPPLIER_ROLE_SLUGS } from '@constants/component-service-flow';
import CellWithTooltip from '@common/CellWithTooltip/CellWithTooltip';
import Pagination from '@common/Pagination/Pagination';

type ColumnDef = {
    header: string;
    key: keyof IndustryBenchmarkingResultItem;
    withActivityTooltip?: boolean;
};

const DEFAULT_COLUMNS: ColumnDef[] = [
    { header: 'Component or Service Name', key: 'referenceProductName' },
    {
        header: 'Activity Description',
        key: 'activityName',
        withActivityTooltip: true,
    },
    { header: 'Supplier Location', key: 'geography' },
    { header: 'CAS Number', key: 'casNumber' },
];

const FOUR_COLUMNS: ColumnDef[] = [
    { header: 'Component or Service Name', key: 'referenceProductName' },
    {
        header: 'Activity Description',
        key: 'activityName',
        withActivityTooltip: true,
    },
    { header: 'Supplier Location', key: 'geography' },
];

const TRANSPORT_COLUMNS: ColumnDef[] = [
    { header: 'Transport Method', key: 'referenceProductName' },
    { header: 'Transport Description', key: 'cpcClassification' },
    { header: 'Transport Region', key: 'geography' },
];

type RoleSlug = (typeof SUPPLIER_ROLE_SLUGS)[keyof typeof SUPPLIER_ROLE_SLUGS];

const FOUR_COL_ROLES: string[] = [
    SUPPLIER_ROLE_SLUGS.STORAGE_AND_FULFILMENT,
    SUPPLIER_ROLE_SLUGS.CPG_BRAND,
    SUPPLIER_ROLE_SLUGS.RETAILER,
    SUPPLIER_ROLE_SLUGS.CONTRACT_MANUFACTURER,
    SUPPLIER_ROLE_SLUGS.PACKAGING_MANUFACTURER_AND_PROCESSOR,
];

export const getSearchResultsTableConfig = (supplierRoleSlug?: string) => {
    if (supplierRoleSlug === SUPPLIER_ROLE_SLUGS.TRANSPORT_AND_FREIGHT) {
        return { columns: TRANSPORT_COLUMNS, useTransportColGrid: true };
    }

    if (supplierRoleSlug && FOUR_COL_ROLES.includes(supplierRoleSlug as RoleSlug)) {
        return { columns: FOUR_COLUMNS, useTransportColGrid: true };
    }

    return { columns: DEFAULT_COLUMNS, useTransportColGrid: false };
};

interface SearchResultsTableComponentProps {
    searchResults: IndustryBenchmarkingResultItem[];
    hasSearched: boolean;
    selectedItems: Set<string>;
    onSelectionChange: (selectedItems: Set<string>) => void;
    supplierRoleSlug?: string;
    skip: number;
    limit: number;
    totalCount: number;
    onPageChange: (skip: number) => void;
}

export const SearchResultsTableComponent = ({
    searchResults,
    hasSearched,
    selectedItems,
    onSelectionChange,
    supplierRoleSlug,
    skip,
    limit,
    totalCount,
    onPageChange,
}: SearchResultsTableComponentProps) => {
    const { columns, useTransportColGrid: useTransportColGrid } = useMemo(
        () => getSearchResultsTableConfig(supplierRoleSlug),
        [supplierRoleSlug]
    );

    const handleToggleSelection = (itemId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        onSelectionChange(newSet);
    };

    const selectedCount = selectedItems.size;

    return (
        <>
            <div className={styles.searchResultsTableContainer}>
                {hasSearched && searchResults.length > 0 && (
                    <>
                        <div className={styles.searchResultsTableHeader}>
                            <div className={styles.searchResultsTableHeaderTitle}>
                                <h3>
                                    Search Results
                                    <span> ({totalCount} Data Points Found)</span>
                                </h3>
                                <p>
                                    Select the component(s) or service(s) that
                                    are most relevant to the activity your
                                    supplier performs in your supply chain.
                                </p>
                            </div>
                            <div className={styles.selectedCount}>
                                <p>
                                    ({selectedCount} Components or Services
                                    Selected)
                                </p>
                            </div>
                        </div>
                        <div className={styles.searchResultsTableBody}>
                            <div
                                className={
                                    styles.searchResultsTableBodyContentWrapper
                                }
                            >
                                <div
                                    className={
                                        styles.searchReasultstableHeader
                                    }
                                >
                                    <div className={styles.none}></div>
                                    <div
                                        className={`${styles.searchReasultstableHeaderTitle
                                            } ${useTransportColGrid
                                                ? styles.useTransportColGrid
                                                : ''
                                            }`}
                                    >
                                        {columns.map((col) => (
                                            <p
                                                key={col.key}
                                                className={
                                                    col.withActivityTooltip
                                                        ? parentStyles.fieldLabelWithTooltip
                                                        : ''
                                                }
                                            >
                                                {col.header}
                                                {col.withActivityTooltip && (
                                                    <Tooltip
                                                        text={
                                                            TOOLTIP_TEXT.ACTIVITY_DESCRIPTION
                                                        }
                                                        noTruncate
                                                    >
                                                        <img
                                                            src={infoIcon}
                                                            alt="info"
                                                            width={10}
                                                            height={10}
                                                            className={
                                                                styles.infoIcon
                                                            }
                                                        />
                                                    </Tooltip>
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                {searchResults.map((item) => {
                                    const isSelected = selectedItems.has(
                                        item._id
                                    );
                                    return (
                                        <div
                                            key={item._id}
                                            className={
                                                styles.searchResultsTableBodyContent
                                            }
                                            onClick={() =>
                                                handleToggleSelection(item._id)
                                            }
                                        >
                                            <div>
                                                <img
                                                    src={
                                                        isSelected
                                                            ? checkedIcon
                                                            : checkIcon
                                                    }
                                                    alt={
                                                        isSelected
                                                            ? 'checked'
                                                            : 'check'
                                                    }
                                                    width={20}
                                                    height={20}
                                                    className={styles.checkboxIcon}
                                                />
                                            </div>
                                            <div
                                                className={`${styles.searchResultsTableBodyContentDetails
                                                    } ${useTransportColGrid
                                                        ? styles.useTransportColGrid
                                                        : ''
                                                    }`}
                                            >
                                                {columns.map((col) => (
                                                    <CellWithTooltip
                                                        key={col.key}
                                                        value={
                                                            (item[
                                                                col.key
                                                            ] as string) || '-'
                                                        }
                                                        className={
                                                            styles.tableCell
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Table Pagination */}
                            <Pagination
                                skip={skip}
                                limit={limit}
                                totalCount={totalCount}
                                onPageChange={onPageChange}
                            />

                        </div>
                    </>
                )}

                {/* Empty State */}
                {hasSearched && searchResults.length === 0 && (
                    <div className={styles.noResultsFound}>
                        <h3>No Results Found</h3>
                        <p>
                            You can try editing the supplier details to improve
                            your search. Alternatively, you can continue without
                            an industry comparison for this component or
                            service.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

