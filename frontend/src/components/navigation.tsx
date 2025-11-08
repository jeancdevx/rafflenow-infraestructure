type NavigationLink = {
  name: string;
  href: string;
  isPrivate?: boolean;
  requiredAdmin?: boolean;
};

export const navigationLinks: NavigationLink[] = [
  { name: "Inicio", href: "/" },
  { name: "Sorteos", href: "/sorteos" },
  {
    name: "Crear Sorteo",
    href: "/crear-sorteo",
    isPrivate: true,
    requiredAdmin: true,
  },
];

export const getNavigationLinks = (
  isAuthenticated: boolean,
  isAdmin: boolean
) => {
  return navigationLinks.filter((link) => {
    if (link.isPrivate && !isAuthenticated) return false;
    if (link.requiredAdmin && !isAdmin) return false;
    return true;
  });
};

export const Navigation = () => {
  return (
    <nav className="flex flex-1 justify-center items-center gap-x-3 text-sm text-muted-foreground font-medium">
      {getNavigationLinks(true, true).map((link) => (
        <a key={link.href} href={link.href} className="mx-2">
          {link.name}
        </a>
      ))}
    </nav>
  );
};
