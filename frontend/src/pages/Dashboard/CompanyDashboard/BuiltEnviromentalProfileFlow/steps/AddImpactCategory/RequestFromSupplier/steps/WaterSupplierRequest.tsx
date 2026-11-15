import SupplierImpactRequestForm from '../SupplierImpactRequestForm';

type ImpactForm = {
  value: string;
  lciaMethod: string;
};

interface WaterSupplierRequestProps {
  data: ImpactForm;
  onChange: (field: keyof ImpactForm, value: string) => void;
  benchmarkValue?: number;
}

const WaterSupplierRequest = (props: WaterSupplierRequestProps) => (
  <SupplierImpactRequestForm
    {...props}
    title="Temporary Data for Water"
    description="Reflects total water consumption associated with this component or service"
    unitSuffix="m³/unit"
  />
);

export default WaterSupplierRequest;
