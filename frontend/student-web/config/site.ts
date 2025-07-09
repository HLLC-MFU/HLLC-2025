import { NavSection } from "@/types/nav";
import {
  LogOutIcon,
  BookIcon,
  QrCode,
  CircleUserRound,
  MessageCircleWarning 
} from "lucide-react";


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
      section: "Activity",
      items: [
        { label: "Activities", href: "/activities", icon: BookIcon },
        { label: "CheckIn", href: "/checkin", icon: QrCode }
      ],
    },
    {
      section: "Account",
      items: [
        { label: "Report", href: "/reports",icon: MessageCircleWarning},
        { label: "Profile", href: "/profile", icon: CircleUserRound },
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
