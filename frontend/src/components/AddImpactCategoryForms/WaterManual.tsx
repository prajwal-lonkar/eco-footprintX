import ImpactManualForm, {
  type ImpactManualFormData,
  type ImpactManualFormConfig,
} from '@components/AddImpactCategoryForms/ImpactManualForm';

const WATER_CONFIG: ImpactManualFormConfig = {
  impactType: 'water',
  title: 'Water',
  description: 'Reflects the water used by this component or service',
  unitSuffix: 'm³/unit',
  showOffsetting: false,
  showNoImpact: true,
};

type WaterFormData = {
  dataSource: string;
  value: string;
  lciaMethod: string;
  confirmAccuracy: boolean;
  noImpact: boolean;
};

interface WaterManualProps {
  formData: WaterFormData;
  setFormData: (data: Partial<WaterFormData>) => void;
  onClearSearchDatabaseForm?: () => void;
  getSavedData?: () => Record<string, any> | null;
  benchmarkValue?: number;
}

const WaterManual = ({ formData, setFormData, ...rest }: WaterManualProps) => (
  <ImpactManualForm
    {...rest}
    formData={formData as ImpactManualFormData}
    setFormData={(data) => setFormData(data as Partial<WaterFormData>)}
    config={WATER_CONFIG}
  />
);

export default WaterManual;
