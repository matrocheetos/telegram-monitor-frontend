import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { I18nProvider } from '../lib/i18n'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
        <Outlet />
      </div>
    </I18nProvider>
  )
}
