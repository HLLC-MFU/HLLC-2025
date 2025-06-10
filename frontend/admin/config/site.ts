import {
  HomeIcon,
  SchoolIcon,
  UserIcon,
  CircleCheckBig,
  SettingsIcon,
  Palette,
  BellRing,
  DollarSignIcon,
  University,
  Megaphone,
  Ticket,
  ShieldAlert,
  LogOutIcon,
  BookOpenCheck,
} from "lucide-react";

import type { NavSection } from "@/types/nav";

export const siteConfig: {
  name: string;
  description: string;
  navMenuItems: NavSection[];
  links: Record<string, string>;
} = {
  name: "HLLC Admin",
  description: "",
  navMenuItems: [
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
        { label: "Notification Management", href: '/notifications', icon: BellRing, permission: "notifications:read" },
        { label: "Reports", href: "/reports", icon: ShieldAlert, permission: "reports:read" },
      ],
    },
    {
      section: "Activity Management",
      items: [
        { label: "Activities", href: "/activities", icon: University, permission: "activities:read" },
        { label: "Checkin", href: "/checkin", icon: CircleCheckBig, permission: "checkin:read" },
        { label: "Assessments", href: "/assessments", icon: BookOpenCheck, permission: "assessments:read" },
      ],
    },
    {
      section: "Sponsor & Evoucher",
      items: [
        { label: "Sponsor", href: "/sponsor", icon: DollarSignIcon, permission: "sponsor:read" },
        { label: "Evoucher", href: "/evoucher", icon: Ticket, permission: "evoucher:read" },
        { label: "Campaign", href: "/campaigns", icon: Megaphone, permission: "campaigns:read" },
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
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
