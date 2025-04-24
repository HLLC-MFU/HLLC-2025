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
  FlowerIcon,
  NotebookPenIcon,
  SpellCheckIcon,
} from "lucide-react";

export const siteConfig = {
  name: "HLLC Admin",
  description: "",
  navMenuItems: [
    {
      section: "Dashboard",
      items: [
        { label: "Home", href: "/", icon: HomeIcon },
      ],
    },
    {
      section: "User Management",
      items: [
        { label: "Schools & Majors", href: "/schools", icon: SchoolIcon },
        { label: "Admin", href: "/admin", icon: UserIcon },
      ],
    },
    {
      section: "Activity Management",
      items: [
        { label: "Activity", href: "/activities", icon: SpellCheckIcon },
        { label: "Assessments", href: "/assessments", icon: NotebookPenIcon },
        { label: "Lamduan Flowers", href: "/lamduans", icon: FlowerIcon},
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
