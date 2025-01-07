import { NextResponse } from 'next/response'

interface Project {
    id: string
    name: string
    status: 'operational' | 'outage'
}

const SAMPLE_PROJECTS: Project[] = [
    { id: '1', name: 'Web Frontend', status: 'operational' },
    { id: '2', name: 'Authentication Service', status: 'operational' },
    { id: '3', name: 'Database', status: 'operational' },
    { id: '4', name: 'API Gateway', status: 'operational' },
    { id: '5', name: 'Storage Service', status: 'operational' },
]

export async function GET() {
    // Randomly set some services to outage
    const projects = SAMPLE_PROJECTS.map(project => ({
        ...project,
        status: Math.random() > 0.7 ? 'outage' : 'operational'
    }))

    return NextResponse.json(projects)
}