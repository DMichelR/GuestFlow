// src/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

interface Tenant {
  name: string;
}

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

  // Base sidebar container and header (same for all roles)
  const renderSidebarContainer = (children: React.ReactNode) => (
    <div className="w-64 bg-gray-800 text-white p-4 min-h-screen">
      <div className="mb-6">
        <Link href="/">
          <h2 className="text-xl font-bold hover:text-gray-300 cursor-pointer">
            {tenant?.name || "Loading tenant..."}
          </h2>
        </Link>
      </div>
      {children}
    </div>
  );

  // If the user is admin, only show admin options
  if (userRole === "admin") {
    return renderSidebarContainer(
      <nav className="space-y-2">
        <Link
          href="/tenants"
          className="block px-4 py-2 rounded hover:bg-gray-700"
        >
          Administrar Hoteles
        </Link>
        <Link
          href="/admin-users"
          className="block px-4 py-2 rounded hover:bg-gray-700"
        >
          Administrar Usuarios
        </Link>
      </nav>
    );
  }

  // If the user is a receptionist, show only Reservas and Huespedes
  if (userRole === "receptionist") {
    return renderSidebarContainer(
      <nav className="space-y-2">
        <Link
          href="/reservations"
          className="block px-4 py-2 rounded hover:bg-gray-700"
        >
          Reservas
        </Link>
        <Link
          href="/guests"
          className="block px-4 py-2 rounded hover:bg-gray-700"
        >
          Huespedes
        </Link>
      </nav>
    );
  }

  // If the user is staff, show only Huespedes
  if (userRole === "staff") {
    return renderSidebarContainer(
      <nav className="space-y-2">
        <Link
          href="/guests"
          className="block px-4 py-2 rounded hover:bg-gray-700"
        >
          Huespedes
        </Link>
      </nav>
    );
  }

  // For managers, show all regular options
  return renderSidebarContainer(
    <nav className="space-y-2">
      <Link
        href="/dashboard/metabase"
        className="block px-4 py-2 rounded hover:bg-gray-700"
      >
        Reportes
      </Link>
      <Link
        href="/reservations"
        className="block px-4 py-2 rounded hover:bg-gray-700"
      >
        Reservas
      </Link>
      <Link
        href="/guests"
        className="block px-4 py-2 rounded hover:bg-gray-700"
      >
        Huespedes
      </Link>
      <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-700">
        Administrar Staff
      </Link>
      <Link
        href="/caracteristicas"
        className="block px-4 py-2 rounded hover:bg-gray-700"
      >
        Administrar Caracteristicas
      </Link>
    </nav>
  );
}
