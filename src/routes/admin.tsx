import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { getAuthUser } from '@/lib/auth/server'
import { useAuth } from '@/hooks/useAuth'
import { LogOut, Bell } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const user = await getAuthUser()
    if (!user || user.role !== 'admin') {
      throw redirect({ to: '/auth/connexion' })
    }
    return { user }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user, logout, isLoggingOut } = useAuth()

  return (
    <div className="flex h-screen bg-[--bg-page]">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-[--border-default] bg-[--bg-card] px-6">
          <div>
            <h1 className="text-lg font-semibold text-[--text-primary]">
              Administration
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications placeholder */}
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-semibold text-white">
                3
              </span>
            </Button>

            {/* User info */}
            <div className="flex items-center gap-3 border-l border-[--border-default] pl-4">
              <div className="text-right">
                <p className="text-sm font-medium text-[--text-primary]">
                  {user?.firstName || 'Admin'}
                </p>
                <p className="text-xs text-[--text-muted]">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => logout()}
                disabled={isLoggingOut}
                title="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
