// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
        <ClerkProvider publishableKey={publishableKey}>
            <ClientLayout>
                {children}
            </ClientLayout>
        </ClerkProvider>
        </body>
        </html>
    );
}
