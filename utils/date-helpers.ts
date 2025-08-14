/**
 * Get date range for the last N days
 * @param days Number of days to go back (default: 30)
 * @returns Object with start_date and end_date in YYYY-MM-DD format
 */
export function getLast30DaysRange(days: number = 30): { start_date: string; end_date: string } {
  const today = new Date();
  const startDate = new Date();
  
  // Set start date to N days ago
  startDate.setDate(today.getDate() - days);
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    start_date: formatDate(startDate),
    end_date: formatDate(today)
  };
}

/**
 * Get date range for the current month
 */
export function getCurrentMonthRange(): { start_date: string; end_date: string } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    start_date: formatDate(firstDay),
    end_date: formatDate(today)
  };
}

/**
 * Get date range for the current week
 */
export function getCurrentWeekRange(): { start_date: string; end_date: string } {
  const today = new Date();
  const firstDay = new Date(today);
  
  // Get Monday of current week
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so we need to handle it
  firstDay.setDate(today.getDate() - daysToMonday);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    start_date: formatDate(firstDay),
    end_date: formatDate(today)
  };
}