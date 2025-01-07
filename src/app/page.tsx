import { AuthTest } from '@/components/auth-test'
import { ProjectList } from '@/components/project-list'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">App Status Dashboard</h1>
          <p className="text-gray-600">Monitor the operational status of your services</p>
          <div className="mt-4">
            <AuthTest />
          </div>
        </header>
        <ProjectList />
      </div>
    </main>
  )
}
