// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <ClerkProvider>
            <ClientLayout>
                {children}
            </ClientLayout>
        </ClerkProvider>
        </body>
        </html>
    );
}
