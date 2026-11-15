
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureComingSoonModal from '@components/modals/FeatureComingSoonModal/FeatureComingSoonModal';

const Supplier = () => {
  const navigate = useNavigate();
  const [showComingSoonModal, setShowComingSoonModal] = useState(true);

  return (
    <>
      {showComingSoonModal && (
        <FeatureComingSoonModal
          title="Suppliers Tab"
          message="This tab will be coming soon"
          goBackBtnText="Go Back"
          GoBack={() => {
            setShowComingSoonModal(false);
            navigate(-1);
          }}
        />
      )}
    </>
  );
};

export default Supplier;