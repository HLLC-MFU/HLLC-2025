import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from '@heroui/navbar';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import NextLink from 'next/link';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { Href } from '@react-types/shared';
import { Tooltip } from '@heroui/react';
import { useState } from 'react';

import { ProgressBar } from './ui/progressBar';

import { siteConfig } from '@/config/site';
import { SearchIcon, Logo } from '@/components/icons';
import { useProfile } from '@/hooks/useProfile';
import { useProgress } from '@/hooks/useProgress';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const user = useProfile(state => state.user);
  const { progress, progressLoading } = useProgress();

  const handleClick = (href: Href) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  const hasPermission = (permission?: string): boolean => {
    if (!permission) return true;
    const perms = user?.role?.permissions || [];

    if (perms.includes('*')) return true;

    const [resource] = permission.split(':');

    return perms.includes(permission) || perms.includes(`${resource}:*`);
  };

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: 'bg-default-100',
        input: 'text-sm',
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
      isMenuOpen={isMenuOpen}
      maxWidth="full"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">ACME</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/*Desktop Nav Items */}
      <NavbarContent className="hidden sm:flex gap-2" justify="end">
        {siteConfig.navMenuItems.flatMap(section =>
          section.items
            .filter(item => hasPermission(item.permission))
            .map(item => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <NavbarItem key={item.href}>
                  <Tooltip placement="bottom">
                    <Button
                      className="relative"
                      variant={isActive ? 'shadow' : 'light'}
                      onPress={() => handleClick(item.href)}
                    >
                      <Icon
                        className={clsx(
                          'w-5 h-5 z-10',
                          isActive ? 'text-primary' : 'text-default-500',
                        )}
                      />
                    </Button>
                  </Tooltip>
                </NavbarItem>
              );
            }),
        )}

        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
      </NavbarContent>

      {/*Mobile Right Content */}
      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ProgressBar
          loading={progressLoading}
          progressBarActivities={progress}
        />
        <NavbarMenuToggle onChange={() => setIsMenuOpen(prev => !prev)} />
      </NavbarContent>

      {/*Mobile Menu */}
      <NavbarMenu>
        {searchInput}
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navMenuItems.map(section => {
            const visibleItems = section.items.filter(item =>
              hasPermission(item.permission),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.section} className="space-y-1">
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-default-500 uppercase tracking-wider">
                    {section.section}
                  </p>
                </div>

                <div className="space-y-1 px-2">
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);

                    return (
                      <NavbarMenuItem key={item.href}>
                        <Button
                          fullWidth
                          className="flex items-center gap-2"
                          variant={isActive ? 'shadow' : 'light'}
                          onPress={() => handleClick(item.href)}
                        >
                          <Icon
                            className={clsx(
                              'w-5 h-5',
                              isActive ? 'text-primary' : 'text-default-500',
                            )}
                          />
                          <span>{item.label}</span>
                          <span
                            className={clsx(
                              'absolute left-0 top-0 h-full w-1 rounded-r-md transition-all duration-200 ease-in-out',
                              isActive ? 'bg-primary' : 'bg-transparent',
                            )}
                          />
                        </Button>
                      </NavbarMenuItem>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
