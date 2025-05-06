// src/app/dashboard/metabase/page.ts
'use client'

import { useEffect, useState } from 'react'

export default function MetabaseDashboard() {
    const [iframeUrl, setIframeUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchMetabaseUrl = async () => {
            try {
                const response = await fetch('/api/metabase/dashboard')
                if (!response.ok) throw new Error('Failed to get Metabase URL')

                const data = await response.json()
                setIframeUrl(data.iframeUrl)
            } catch (err) {
                setError('Error loading dashboard')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchMetabaseUrl()
    }, [])

    if (loading) return <div className="flex justify-center py-20">Loading analytics dashboard...</div>
    if (error) return <div className="text-red-500 py-10 text-center">{error}</div>

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

            <div className="bg-white rounded-lg shadow-md p-6 h-[800px]">
                {iframeUrl && (
                    <iframe
                        src={iframeUrl}
                        frameBorder="0"
                        width="100%"
                        height="100%"
                        allowTransparency
                    ></iframe>
                )}
            </div>
        </div>
    )
}
