export function getCurrentDateString(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${month}/${day}`;
}

/**
 * 获取今天的开始时间（00:00:00）
 */
export function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 获取今天的结束时间（23:59:59）
 */
export function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

/**
 * 检查给定日期是否是今天
 */
export function isToday(date: string | Date): boolean {
  const targetDate = new Date(date);
  const today = new Date();
  
  return (
    targetDate.getFullYear() === today.getFullYear() &&
    targetDate.getMonth() === today.getMonth() &&
    targetDate.getDate() === today.getDate()
  );
}

/**
 * 检查给定日期是否在指定的日期范围内
 */
export function isDateInRange(
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean {
  const targetDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return targetDate >= start && targetDate <= end;
}

/**
 * 获取日期的开始时间（当天00:00:00）
 */
export function getDateStart(date: string | Date): Date {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * 获取日期的结束时间（当天23:59:59）
 */
export function getDateEnd(date: string | Date): Date {
  const targetDate = new Date(date);
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
}

/**
 * 格式化日期为ISO字符串（用于数据库存储）
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString();
}

/**
 * 检查日期是否早于今天
 */
export function isBeforeToday(date: string | Date): boolean {
  const targetDate = new Date(date);
  const today = getTodayStart();
  return targetDate < today;
} 