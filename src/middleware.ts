import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { hasDrrAccess } from '@/lib/access'

const ROLE_DASHBOARDS: Record<string, string> = {
  HRD: '/hrd/dashboard',
  DEC: '/dec/dashboard',
  DRR: '/drr/dashboard',
  CLUB: '/club/dashboard',
  DCM: '/dcm/dashboard',
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  // Root → redirect to dashboard or login
  if (pathname === '/') {
    if (role && ROLE_DASHBOARDS[role]) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[role], req.url))
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Login → redirect to dashboard if already authed
  if (pathname === '/login') {
    if (role && ROLE_DASHBOARDS[role]) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[role], req.url))
    }
    return NextResponse.next()
  }

  // Protected routes
  const routeRoleMap: { prefix: string; requiredRole: string }[] = [
    { prefix: '/hrd/', requiredRole: 'HRD' },
    { prefix: '/dec/', requiredRole: 'DEC' },
    { prefix: '/drr/', requiredRole: 'DRR' },
    { prefix: '/club/', requiredRole: 'CLUB' },
    { prefix: '/dcm/', requiredRole: 'DCM' },
  ]

  for (const { prefix, requiredRole } of routeRoleMap) {
    if (pathname.startsWith(prefix)) {
      if (!role) return NextResponse.redirect(new URL('/login', req.url))
      if (prefix === '/drr/') {
        if (!hasDrrAccess(req.auth?.user as { role?: string; email?: string })) {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
        return NextResponse.next()
      }
      if (role !== requiredRole) return NextResponse.redirect(new URL('/unauthorized', req.url))
      return NextResponse.next()
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/', '/login', '/hrd/:path*', '/dec/:path*', '/drr/:path*', '/club/:path*', '/dcm/:path*'],
}
