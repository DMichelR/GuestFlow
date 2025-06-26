// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

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
    href: "/dashboard/metabase",
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
    <div className="w-64 bg-gray-800 border-r border-gray-800 shadow-lg shadow-gray-800 text-gray-100 p-4 min-h-screen">
      <div className="mb-6">
        <Link href="/" className="hover:text-gray-500">
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
    <nav className="space-y-2 ">
      {filteredMenuItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors"
          prefetch={false}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
