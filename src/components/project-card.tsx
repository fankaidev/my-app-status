interface ProjectCardProps {
    project: {
        id: string
        name: string
        status: 'operational' | 'outage'
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
            <div className="flex items-center gap-2">
                <div
                    className={`w-3 h-3 rounded-full ${project.status === 'operational'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                />
                <span className="capitalize">{project.status}</span>
            </div>
        </div>
    )
}