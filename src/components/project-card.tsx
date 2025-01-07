interface Project {
    id: string
    name: string
    status: 'operational' | 'outage'
}

interface ProjectCardProps {
    project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
    const statusColor = project.status === 'operational' ? 'bg-green-500' : 'bg-red-500'

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                <div className={`w-3 h-3 rounded-full ${statusColor}`} />
            </div>
            <p className="text-sm text-gray-600 capitalize">{project.status}</p>
        </div>
    )
}