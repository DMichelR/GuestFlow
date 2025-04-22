// src/components/ClientLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.includes('/sign-in') || pathname.includes('/sign-up');

    return (
        <div className="flex min-h-screen">
            {!isAuthPage && <Sidebar />}
            <div className={`flex-1 ${isAuthPage ? '' : 'p-8'}`}>
                {children}
            </div>
        </div>
    );
}
