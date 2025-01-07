'use client'
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

    useEffect(() => {
        fetch('/api/projects')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch projects')
                }
                return res.json()
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
        return <div className="text-center p-4">Loading projects...</div>
    }

    if (error) {
        return <div className="text-center text-red-500 p-4">{error}</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    )
}