import SupplierImpactRequestForm from '../SupplierImpactRequestForm';

type ImpactForm = {
  value: string;
  lciaMethod: string;
};

interface LandSupplierRequestProps {
  data: ImpactForm;
  onChange: (field: keyof ImpactForm, value: string) => void;
  benchmarkValue?: number;
}

const LandSupplierRequest = (props: LandSupplierRequestProps) => (
  <SupplierImpactRequestForm
    {...props}
    title="Temporary Data for Land"
    description="Reflects the volume of land used by this component or service"
    unitSuffix="m²/unit"
  />
);

export default LandSupplierRequest;
