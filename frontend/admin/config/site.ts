import {
  HomeIcon,
  SchoolIcon,
  UserIcon,
  CircleCheckBig ,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  ShieldAlert,
  Megaphone,
  Ticket,
  Palette,
  BellRing,
  DollarSignIcon,
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
        { label: "Notification Management", href: '/notifications', icon: BellRing },
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
    // {
    //   section: "Sponsor",
    //   items: [
    //     { label: "Sponosr", href: "/sponsor", icon: DollarSignIcon },
    //   ],
    // },
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