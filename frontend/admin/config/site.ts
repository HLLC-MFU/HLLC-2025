import {
  HomeIcon,
  SchoolIcon,
  UserIcon,
  LayoutDashboardIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  CircleCheckBig ,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  ShieldAlert,
<<<<<<<<< Temporary merge branch 1
  
=========
  Megaphone,
  Ticket,
  Palette,
  BellRing,
  University,
} from "lucide-react";

export const siteConfig = {
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
<<<<<<<<< Temporary merge branch 1
=========
        { label: "Notification Management", href: '/notifications', icon: BellRing },
>>>>>>>>> Temporary merge branch 2
        { label: "Checkin" , href: "/checkin", icon: CircleCheckBig},
        { label: "Schools & Majors", href: "/schools", icon: SchoolIcon },
        { label: "Users Management", href: "/users", icon: UserIcon },
        { label: "Reports", href: "/reports", icon: ShieldAlert },
        { label: "Activities", href: "/activities", icon: University },
      ],
    },
    {
      section: "Evoucher Management",
      items: [
        { label: "Evoucher", href: "/evoucher", icon: Ticket },
        { label: "Campaign", href: "/campaigns", icon: Megaphone },
      ],
    },
    {
      section: "Settings",
      items: [
        { label: "Settings", href: "/settings", icon: SettingsIcon },
        { label: "Help & Feedback", href: "/help-feedback", icon: HelpCircleIcon },
        { label: "Appearance", href: "/appearance", icon: Palette }
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