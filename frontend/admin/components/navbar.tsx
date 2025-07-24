import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import NextLink from "next/link";
import { Input } from "@heroui/input";

import { ThemeSwitch } from "@/components/theme-switch";
import {
  SearchIcon,
} from "@/components/icons";
import { useProfile } from "@/hooks/useProfile";
import { getMenuByRole } from "@/config/getMenuByRole";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = useProfile((state) => state.user); // 🧠 ดึง user จาก Zustand
  const navMenuItems = getMenuByRole(user); // 👈 ฟิลเตอร์เมนูตาม role
  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <HeroUINavbar
      maxWidth="full" 
      position="sticky"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >

      <NavbarContent
        className="hidden lg:flex basis-1/5 lg:basis-full"
        justify="end"
      >
        <NavbarItem className="flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="flex">
          {searchInput}
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="flex lg:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            {searchInput}
          </NavbarMenuItem>
          {navMenuItems.map((section) => (
            <div key={section.section} className="space-y-2">
              <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                {section.section}
              </p>
              {section.items.map((item, index) => (
                <NavbarMenuItem key={`${item.href}-${index}`}>
                  <NextLink
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center gap-2 text-lg text-foreground"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NextLink>
                </NavbarMenuItem>
              ))}
            </div>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
