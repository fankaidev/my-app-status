import { ProjectList } from '@/components/project-list'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">App Status Dashboard</h1>
      <ProjectList />
    </main>
  )
}
