'use client'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { ProjectCard } from './project-card'

interface Project {
    id: string
    name: string
    status: 'operational' | 'outage'
}

export function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isUnauthorized, setIsUnauthorized] = useState(false)

    useEffect(() => {
        fetch('/api/projects')
            .then(res => {
                if (res.status === 401) {
                    setIsUnauthorized(true)
                    throw new Error('Please sign in to view projects')
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch projects')
                }
                return res.json() as Promise<Project[]>
            })
            .then((data: Project[]) => {
                setProjects(data)
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500" />
            </div>
        )
    }

    if (isUnauthorized) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <h3 className="text-lg font-medium text-yellow-900 mb-2">Authentication Required</h3>
                <p className="text-yellow-700 mb-4">Please sign in to view the project status.</p>
                <button
                    onClick={() => signIn('github')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                >
                    Sign in with GitHub
                </button>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-red-700">
                <p className="font-medium">Error loading projects</p>
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    )
}