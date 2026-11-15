import ImpactManualForm, {
  type ImpactManualFormData,
  type ImpactManualFormConfig,
} from '@components/AddImpactCategoryForms/ImpactManualForm';

const LAND_CONFIG: ImpactManualFormConfig = {
  impactType: 'land',
  title: 'Land',
  description:
    'Reflects the land area occupied or transformed by this component or service',
  unitSuffix: 'm²/unit',
  showOffsetting: false,
  showNoImpact: true,
};

type LandFormData = {
  dataSource: string;
  value: string;
  lciaMethod: string;
  confirmAccuracy: boolean;
  noImpact: boolean;
};

interface LandManualProps {
  formData: LandFormData;
  setFormData: (data: LandFormData) => void;
  onClearSearchDatabaseForm?: () => void;
  getSavedData?: () => Record<string, any> | null;
  benchmarkValue?: number;
}

const LandManual = ({ formData, setFormData, ...rest }: LandManualProps) => (
  <ImpactManualForm
    {...rest}
    formData={formData as ImpactManualFormData}
    setFormData={(data) => setFormData(data as LandFormData)}
    config={LAND_CONFIG}
  />
);

export default LandManual;
