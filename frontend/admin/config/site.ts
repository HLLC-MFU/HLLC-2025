import type { NavSection } from "@/types/nav";

import {
  HomeIcon,
  SchoolIcon,
  UserIcon,
  CircleCheckBig,
  SettingsIcon,
  Palette,
  BellRing,
  University,
  Megaphone,
  ShieldAlert,
  LogOutIcon,
  Flower,
  CircleDollarSign,
  Footprints,
  MessagesSquare,
  BookCheck,
  Coins,
} from "lucide-react";

const basePath = process.env.NEXT_BASE_PATH || "";

function withBasePath(nav: NavSection[]): NavSection[] {
  return nav.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: item.href.startsWith("http") ? item.href : `${basePath}${item.href}`,
    })),
  }));
}

const rawNavMenuItems: NavSection[] = [
  {
    section: "Dashboard",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
    ],
  },
  {
    section: "User Management",
    items: [
      { label: "Schools & Majors", href: "/schools", icon: SchoolIcon, permission: "schools:read" },
      { label: "Users Management", href: "/users", icon: UserIcon, permission: "users:read" },
      { label: "Notifications", href: "/notifications", icon: BellRing, permission: "notification:read" },
      { label: "Activities", href: "/activities", icon: University, permission: "activities:read" },
      { label: "Checkin", href: "/checkin", icon: CircleCheckBig, permission: "checkin:read" },
      { label: "Assessment ", href: "/assessments", icon: BookCheck, permission: "assessment:read" },
      { label: "Reports", href: "/reports", icon: ShieldAlert, permission: "reports:read" },
      { label: "Step Counters", href: "/step-counters", icon: Footprints, permission: "step-counters:read" },
      { label: "Coin Hunting", href: "/coin-hunting", icon: Coins, permission: "coin-hunting:read" },
    ],
  },
  {
    section: "Sponsor & Evoucher",
    items: [
      { label: "Sponsor Systems", href: "/sponsor-systems", icon: CircleDollarSign, permission: "sponsor:read, evoucher:read, evoucher-code:read" },
    ],
  },
  {
    section: "Lamduan",
    items: [
      { label: "Lamduan Flowers", href: "/lamduanflowers", icon: Flower, permission: "lamduan-flowers:read" },
    ],
  },
  {
    section: "Chat System",
    items: [
      { label: "Chat", href: "/chat", icon: MessagesSquare, permission: "chat:read" },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: SettingsIcon, permission: "system:read" },
      { label: "Appearance", href: "/appearance", icon: Palette, permission: "appearance:read" },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "Logout", href: "/logout", icon: LogOutIcon },
    ],
  },
];

export const siteConfig: {
  name: string;
  description: string;
  navMenuItems: NavSection[];
} = {
  name: "HLLC Admin",
  description: "",
  navMenuItems: withBasePath(rawNavMenuItems),
};
