import type { DefaultSession, DefaultJWT } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      avenueId?: string | null
      clubId?: string | null
      dcmRecordId?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: string
    avenueId?: string | null
    clubId?: string | null
    dcmRecordId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    avenueId?: string | null
    clubId?: string | null
    dcmRecordId?: string | null
  }
}
