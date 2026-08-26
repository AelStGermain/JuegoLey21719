export const ACTIVE_CASE_IDS = [1, 2, 3] as const;

export const CASE_APPLICATION_IDS: Record<1 | 2 | 3, readonly string[]> = {
  1: ['mail', 'spreadsheet'],
  2: ['aelchat', 'spreadsheet'],
  3: ['mail', 'spreadsheet'],
};

export const getCaseApplicationIds = (day: number) => (
  CASE_APPLICATION_IDS[day === 3 ? 3 : day === 2 ? 2 : 1]
);

export const getCaseProgressPosition = (day: number) => (
  day === 3 ? 3 : day === 2 ? 2 : 1
);

export const isApplicationAvailableInCase = (day: number, appId: string) => (
  (getCaseApplicationIds(day) as readonly string[]).includes(appId)
);
