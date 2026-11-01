export interface AppNavigationItem {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
}

export const APP_NAVIGATION: AppNavigationItem[] = [
  {
    label: "Thi chính thức",
    href: "/examination",
    match: (pathname) => pathname.startsWith("/examination"),
  },
  {
    label: "Ôn luyện",
    href: "/practice",
    match: (pathname) =>
      pathname.startsWith("/practice") &&
      !pathname.startsWith("/practice/history") &&
      !pathname.startsWith("/practice/leaderboard"),
  },
  {
    label: "Lịch sử thi",
    href: "/practice/history",
    match: (pathname) => pathname.startsWith("/practice/history"),
  },
  {
    label: "Xếp hạng",
    href: "/practice/leaderboard",
    match: (pathname) => pathname.startsWith("/practice/leaderboard"),
  },
  {
    label: "Tiến độ",
    href: "/progress",
    match: (pathname) => pathname.startsWith("/progress"),
  },
  {
    label: "Kết quả",
    href: "/results",
    match: (pathname) => pathname.startsWith("/results"),
  },
];