// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

interface Tenant {
  name: string;
}

interface MenuItem {
  href: string;
  label: string;
  roles: string[];
}

// Define all menu items and their associated roles
const menuItems: MenuItem[] = [
  { href: "/tenants", label: "Hoteles", roles: ["admin"] },
  { href: "/admin-users", label: "Usuarios", roles: ["admin"] },
  {
    href: "/dashboard/reco",
    label: "Reportes",
    roles: ["admin", "manager"],
  },
  {
    href: "/caracteristicas",
    label: "Caracteristicas",
    roles: ["manager"],
  },
  { href: "/admin", label: "Empleados", roles: ["manager"] },
  {
    href: "/reservations",
    label: "Reservas",
    roles: ["receptionist", "manager"],
  },
  {
    href: "/guests",
    label: "Huespedes",
    roles: ["receptionist", "staff", "manager"],
  },
  {
    href: "/tickets",
    label: "Boletas de Servicio",
    roles: ["receptionist", "staff", "manager"],
  },
];

export default function Sidebar() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [, setLoading] = useState(true);
  const { isLoaded } = useAuth();
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch("/api/tenant");
        const data = await response.json();
        setTenant(data);
      } catch (error) {
        console.error("Error fetching tenant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata.role as string;
      setUserRole(role);
    }
  }, [isLoaded, user]);

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  // Base sidebar container and header (same for all roles)
  // Obtener el tenantId para verificar si es el administrador principal
  const tenantId = user?.publicMetadata?.tenantId as string;
  const isAdminTenant = tenantId === "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  const renderSidebarContainer = (children: React.ReactNode) => (
    <div className="w-64 bg-primary text-primary-foreground border-r border-border shadow-sm p-5 min-h-screen flex flex-col">
      <div className="mb-6">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <h2 className="text-xl font-bold cursor-pointer">
            {isAdminTenant
              ? "Administrador"
              : tenant?.name || "Loading tenant..."}
          </h2>
        </Link>
      </div>
      {children}
    </div>
  );

  return renderSidebarContainer(
    <nav className="space-y-1.5">
      {filteredMenuItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all 
            ${
              isActive
                ? "bg-secondary/80 text-secondary-foreground shadow-sm translate-x-1"
                : "hover:bg-secondary/40 hover:text-secondary-foreground hover:translate-x-1"
            }
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            prefetch={false}
          >
            {item.label}
            {isActive && (
              <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground ml-auto"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
