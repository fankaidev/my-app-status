interface ProjectCardProps {
    project: {
        id: string
        name: string
        status: 'operational' | 'outage'
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{project.name}</h2>
            <div className="flex items-center gap-3">
                <div
                    className={`w-3 h-3 rounded-full ${project.status === 'operational'
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-red-500'
                        }`}
                />
                <span className={`capitalize font-medium ${project.status === 'operational'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}>
                    {project.status}
                </span>
            </div>
        </div>
    )
}