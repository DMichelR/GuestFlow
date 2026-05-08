"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  Users,
  BedDouble,
  Calendar as CalendarIcon,
  TrendingUp,
  Settings,
  Server,
  Building2,
  Globe,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import OccupancyTab from "@/components/dashboard/OccupancyTab";
import IncomeTab from "@/components/dashboard/IncomeTab";
import FutureReservationsTab from "@/components/dashboard/FutureReservationsTab";
import ServicesTab from "@/components/dashboard/ServicesTab";
import RoomsTab from "@/components/dashboard/RoomsTab";
import GuestsTab from "@/components/dashboard/GuestsTab";

// Admin tabs
import AdminSystemMetricsTab from "@/components/dashboard/admin/AdminSystemMetricsTab";
import AdminTenantsTab from "@/components/dashboard/admin/AdminTenantsTab";
import AdminAnalyticsTab from "@/components/dashboard/admin/AdminAnalyticsTab";

export default function AnalyticsDashboard() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("occupancy");

  useEffect(() => {
    if (user) {
      const userRole = user.publicMetadata?.role as string;
      // Set default tab based on role
      if (userRole === "admin") {
        setActiveTab("system-metrics");
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p>Cargando...</p>
      </div>
    );
  }

  const userRole = user.publicMetadata?.role as string;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {userRole === "admin"
              ? "Panel de Administración del Sistema"
              : "Análisis y Recomendaciones"}
          </h1>
        </div>
        {userRole === "admin" && (
          <p className="text-sm text-muted-foreground">
            Vista global de todos los tenants y métricas del sistema usando
            ClickHouse
          </p>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {userRole === "admin" ? (
          // Admin Tabs
          <>
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-1 rounded-xl">
              <TabsTrigger
                value="system-metrics"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Métricas del Sistema</span>
              </TabsTrigger>
              <TabsTrigger
                value="tenants"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tenants</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Análisis Global</span>
              </TabsTrigger>
            </TabsList>

            {/* Admin Tab 1: System Metrics */}
            <TabsContent value="system-metrics" className="mt-6">
              <AdminSystemMetricsTab />
            </TabsContent>

            {/* Admin Tab 2: Tenants */}
            <TabsContent value="tenants" className="mt-6">
              <AdminTenantsTab />
            </TabsContent>

            {/* Admin Tab 3: Analytics */}
            <TabsContent value="analytics" className="mt-6">
              <AdminAnalyticsTab />
            </TabsContent>
          </>
        ) : (
          // Manager/Regular User Tabs
          <>
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-1 rounded-xl">
              <TabsTrigger
                value="occupancy"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Ocupación</span>
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Ingresos</span>
              </TabsTrigger>
              <TabsTrigger
                value="reservations"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Reservas</span>
              </TabsTrigger>
              <TabsTrigger
                value="services"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Servicios</span>
              </TabsTrigger>
              <TabsTrigger
                value="rooms"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <BedDouble className="h-4 w-4" />
                <span className="hidden sm:inline">Habitaciones</span>
              </TabsTrigger>
              <TabsTrigger
                value="guests"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Huéspedes</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Ocupación */}
            <TabsContent value="occupancy" className="mt-6">
              <OccupancyTab />
            </TabsContent>

            {/* Tab 2: Ingresos y Cancelaciones */}
            <TabsContent value="income" className="mt-6">
              <IncomeTab />
            </TabsContent>

            {/* Tab 3: Reservas Futuras */}
            <TabsContent value="reservations" className="mt-6">
              <FutureReservationsTab />
            </TabsContent>

            {/* Tab 4: Análisis de Servicios */}
            <TabsContent value="services" className="mt-6">
              <ServicesTab />
            </TabsContent>

            {/* Tab 5: Análisis de Habitaciones */}
            <TabsContent value="rooms" className="mt-6">
              <RoomsTab />
            </TabsContent>

            {/* Tab 6: Análisis de Huéspedes */}
            <TabsContent value="guests" className="mt-6">
              <GuestsTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
