import ImpactDatabaseForm, {
  type ImpactDatabaseFormConfig,
} from '@components/AddImpactCategoryForms/ImpactDatabaseForm';
import type { CarbonImpactData } from '@type/built-enviromental-profile';

const CARBON_CONFIG: ImpactDatabaseFormConfig = {
  impactType: 'carbon',
  componentName: 'CarbonDatabase',
  title: 'Carbon',
  description: 'Total carbon emissions for this component or service',
  unitSuffix: 'kg CO₂ eq/unit',
  radioName: 'carbonDbResult',
  showOffsetting: true,
};

interface CarbonDatabaseProps {
  formData: Partial<CarbonImpactData>;
  setFormData: (data: Partial<CarbonImpactData>) => void;
  supplierRoleSlug: string;
  roleDetailsId?: string;
  onSearchStatusChange?: (status: 'idle' | 'no-results' | 'error') => void;
  getSavedData?: () => Partial<CarbonImpactData> | null;
  benchmarkValue?: number;
  searchResetToken?: number;
  suppressSavedAuditPrefill?: boolean;
}

const CarbonDatabase = (props: CarbonDatabaseProps) => (
  <ImpactDatabaseForm {...(props as any)} config={CARBON_CONFIG} />
);

export default CarbonDatabase;
