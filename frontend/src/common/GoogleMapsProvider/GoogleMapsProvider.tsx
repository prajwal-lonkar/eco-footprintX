import { LoadScript } from '@react-google-maps/api';
import type { ReactNode } from 'react';
import SpinnerLoader from '@common/SpinnerLoader/SpinnerLoader';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('Google Maps API key is not configured');
    return <>{children}</>;
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={libraries}
      loadingElement={<SpinnerLoader />}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;

