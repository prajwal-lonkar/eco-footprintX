import ImpactDatabaseForm, {
  type ImpactDatabaseFormConfig,
} from '@components/AddImpactCategoryForms/ImpactDatabaseForm';
import type { WaterLandImpactData } from '@type/built-enviromental-profile';

const LAND_CONFIG: ImpactDatabaseFormConfig = {
  impactType: 'land',
  componentName: 'LandDatabase',
  title: 'Land',
  description:
    'Reflects the land area occupied or transformed by this component or service',
  unitSuffix: 'm²/unit',
  radioName: 'landDbResult',
  showNoImpact: true,
};

interface LandDatabaseProps {
  formData: Partial<WaterLandImpactData>;
  setFormData: (data: Partial<WaterLandImpactData>) => void;
  supplierRoleSlug: string;
  roleDetailsId?: string;
  onSearchStatusChange?: (status: 'idle' | 'no-results' | 'error') => void;
  getSavedData?: () => Partial<WaterLandImpactData> | null;
  benchmarkValue?: number;
  searchResetToken?: number;
  suppressSavedAuditPrefill?: boolean;
}

const LandDatabase = (props: LandDatabaseProps) => (
  <ImpactDatabaseForm {...(props as any)} config={LAND_CONFIG} />
);

export default LandDatabase;
