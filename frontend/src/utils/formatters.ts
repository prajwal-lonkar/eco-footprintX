import { TRANSPORT_METHOD_LABELS } from '@constants/component-service-flow';

export const getTransportComponentName = (
  componentName: string,
  transportMethod: string | undefined,
  transportOrigin: string | undefined,
  transportDestination: string | undefined
): string => {
  if (!transportMethod || !transportOrigin || !transportDestination) return componentName;
  const methodLabel =
    TRANSPORT_METHOD_LABELS[transportMethod as keyof typeof TRANSPORT_METHOD_LABELS] ??
    transportMethod;
  return `${methodLabel} transportation of ${componentName} from ${transportOrigin} to ${transportDestination}`;
};

export const isTruncated = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth;
};

//format value for Add impact ctaegory - use our database option
export const formatFetchedValue = (
  value: string | number | null | undefined
): string => {
  if (value === '' || value == null) return '';
  return String(value);
};
