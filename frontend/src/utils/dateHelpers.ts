/**
 * Format ISO date string to "DD MMM YYYY" format (e.g., "12 Jan 2025")
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

/**
 * Calculate the number of days between a given date and today
 * @param dateString - The date to calculate from
 * @returns The number of days since the given date (can be negative if date is in the future)
 */
export const getDaysSinceDate = (dateString: string): number => {
  const startDate = new Date(dateString);
  const currentDate = new Date();

  const start = new Date(startDate.setHours(0, 0, 0, 0));
  const today = new Date(currentDate.setHours(0, 0, 0, 0));

  const diffInMs = today.getTime() - start.getTime();
  return diffInMs / (1000 * 60 * 60 * 24);
};

/**
 * Determine the date dot color based on submission status and days since request
 * @param dateOfRequest - The date when the request was made
 * @param submissionStatus - The current submission status ('pending' | 'submitted' | 'partial' | 'ready')
 * @returns 'red' | 'green' | 'yellow' - The color indicator for the date dot
 */
export const getDateDotcolour = (
  dateOfRequest: string,
  submissionStatus: string
): 'red' | 'green' | 'yellow' => {
  const daysSinceRequest = getDaysSinceDate(dateOfRequest);

  const isFullySubmitted =
    submissionStatus === 'submitted';

  if (isFullySubmitted) {
    return 'green';
  }

  if (daysSinceRequest <= 7 && !isFullySubmitted) {
    return 'yellow';
  }

  if (daysSinceRequest > 7 && !isFullySubmitted) {
    return 'red';
  }

  return 'yellow';
};

/**
 * Get status label from date dot color
 * @param color - The color from getDateDot ('red' | 'green' | 'yellow')
 * @returns The human-readable label for the status
 */
export const getStatusLabelFromColor = (
  color: 'red' | 'green' | 'yellow'
): string => {
  switch (color) {
    case 'green':
      return 'Complete';
    case 'yellow':
      return 'Pending';
    case 'red':
      return 'Overdue';
    default:
      return 'Pending';
  }
};