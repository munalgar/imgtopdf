import type { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  return <div className="layout">{children}</div>
}

export default AppLayout
