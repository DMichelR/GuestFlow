// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Tenant {
    name: string;
}

export default function Sidebar() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const response = await fetch('/api/tenant');
                const data = await response.json();
                setTenant(data);
            } catch (error) {
                console.error('Error fetching tenant:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, []);

    return (
        <div className="w-64 bg-gray-800 text-white p-4 min-h-screen">
            <div className="mb-6">
                <Link href="/">
                    <h2 className="text-xl font-bold hover:text-gray-300 cursor-pointer">
                        {tenant?.name || 'Loading tenant...'}
                    </h2>
                </Link>
            </div>

            <nav className="space-y-2">
                <Link href="/dashboard/metabase" className="block px-4 py-2 rounded hover:bg-gray-700">
                    Dashboard
                </Link>
                <Link href="/reservations" className="block px-4 py-2 rounded hover:bg-gray-700">
                    Reservations
                </Link>
                <Link href="/guests" className="block px-4 py-2 rounded hover:bg-gray-700">
                    Guests
                </Link>
                <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-700">
                    Admin Panel
                </Link>
            </nav>
        </div>
    );
}
