import ImpactManualForm, {
  type ImpactManualFormData,
  type ImpactManualFormConfig,
} from '@components/AddImpactCategoryForms/ImpactManualForm';

const CARBON_CONFIG: ImpactManualFormConfig = {
  impactType: 'carbon',
  title: 'Carbon',
  description: 'Total carbon emissions for this component or service',
  unitSuffix: 'kg CO₂ eq/unit',
  showOffsetting: true,
  showNoImpact: false,
};

type CarbonFormData = {
  dataSource: string;
  value: string;
  lciaMethod: string;
  confirmAccuracy: boolean;
  offsetting: boolean;
  offsetValue: string;
};

interface CarbonManualProps {
  formData: CarbonFormData;
  setFormData: (data: CarbonFormData) => void;
  onClearSearchDatabaseForm?: () => void;
  getSavedData?: () => Record<string, any> | null;
  benchmarkValue?: number;
}

const CarbonManual = ({ formData, setFormData, ...rest }: CarbonManualProps) => (
  <ImpactManualForm
    {...rest}
    formData={formData as ImpactManualFormData}
    setFormData={(data) => setFormData(data as CarbonFormData)}
    config={CARBON_CONFIG}
  />
);

export default CarbonManual;
