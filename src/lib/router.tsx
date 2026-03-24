"use client";

import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import type { AnchorHTMLAttributes } from "react";
import { forwardRef, useCallback, useMemo } from "react";

type SearchParamsInit = Record<string, string | number | boolean | null | undefined> | URLSearchParams;

export type NavigateOptions = {
  replace?: boolean;
};

export function useNavigate() {
  const router = useRouter();

  return (to: string, options?: NavigateOptions) => {
    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();

  return {
    pathname,
    search: "",
    hash: "",
  };
}

export function useParams<T extends Record<string, string | string[] | undefined>>() {
  return useNextParams() as T;
}

export function useSearchParams(): [URLSearchParams, (next: SearchParamsInit, options?: NavigateOptions) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const current = useNextSearchParams();

  const params = useMemo(() => new URLSearchParams(current.toString()), [current]);
  const currentQuery = current.toString();

  const setSearchParams = useCallback((next: SearchParamsInit, options?: NavigateOptions) => {
    const nextParams = next instanceof URLSearchParams ? next : new URLSearchParams();

    if (!(next instanceof URLSearchParams)) {
      Object.entries(next).forEach(([key, value]) => {
        if (value !== undefined && value !== null && `${value}`.length > 0) {
          nextParams.set(key, `${value}`);
        }
      });
    }

    const query = nextParams.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    if (nextUrl === currentUrl) {
      return;
    }

    if (options?.replace) {
      router.replace(nextUrl);
      return;
    }

    router.push(nextUrl);
  }, [currentQuery, pathname, router]);

  return [params, setSearchParams];
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
  prefetch?: boolean;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, prefetch, children, ...rest },
  ref
) {
  return (
    <NextLink href={to} replace={replace} prefetch={prefetch} ref={ref} {...rest}>
      {children}
    </NextLink>
  );
});

type NavLinkClassName = string | ((args: { isActive: boolean; isPending: boolean }) => string);

export type NavLinkProps = Omit<LinkProps, "className"> & {
  className?: NavLinkClassName;
  activeClassName?: string;
  pendingClassName?: string;
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { className, activeClassName, pendingClassName, to, ...rest },
  ref
) {
  const pathname = usePathname();
  const isActive = pathname === to;

  const computedClassName =
    typeof className === "function"
      ? className({ isActive, isPending: false })
      : [className, isActive ? activeClassName : null].filter(Boolean).join(" ");

  return (
    <Link ref={ref} to={to} className={computedClassName} {...rest}>
      {rest.children}
    </Link>
  );
});
