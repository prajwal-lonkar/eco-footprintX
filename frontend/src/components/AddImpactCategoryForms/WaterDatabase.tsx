import ImpactDatabaseForm, {
  type ImpactDatabaseFormConfig,
} from '@components/AddImpactCategoryForms/ImpactDatabaseForm';
import type { WaterLandImpactData } from '@type/built-enviromental-profile';

const WATER_CONFIG: ImpactDatabaseFormConfig = {
  impactType: 'water',
  componentName: 'WaterDatabase',
  title: 'Water',
  description: 'Reflects the water used by this component or service',
  unitSuffix: 'm³/unit',
  radioName: 'waterDbResult',
  showNoImpact: true,
};

interface WaterDatabaseProps {
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

const WaterDatabase = (props: WaterDatabaseProps) => (
  <ImpactDatabaseForm {...(props as any)} config={WATER_CONFIG} />
);

export default WaterDatabase;
