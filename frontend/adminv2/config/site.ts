import {
  HomeIcon,
  SchoolIcon,
  UserIcon,
  LayoutDashboardIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
} from "lucide-react";

export const siteConfig = {
  name: "HLLC Admin",
  description: "",
  // navItems: [
  //   {
  //     label: "Home",
  //     href: "/",
  //     icon: HomeIcon,
  //   },
  //   {
  //     label: "Schools & Majors",
  //     href: "/schools",
  //     icon: SchoolIcon,
  //   },
  // ],
  navMenuItems: [
    {
      section: "Main",
      items: [
        { label: "Home", href: "/", icon: HomeIcon },
        { label: "Schools & Majors", href: "/schools", icon: SchoolIcon },
      ],
    },
    {
      section: "Settings",
      items: [
        { label: "Settings", href: "/settings", icon: SettingsIcon },
        { label: "Help & Feedback", href: "/help-feedback", icon: HelpCircleIcon },
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
