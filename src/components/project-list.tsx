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

    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => {
                setProjects(data)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    )
}