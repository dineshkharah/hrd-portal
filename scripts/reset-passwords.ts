import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwords: Record<string, string> = {
    HRD: 'HRD@3141',
    DRR: 'DRR@3141',
    DEC: 'DEC@3141',
    DCM: 'district3141',
    CLUB: 'district3141',
  }

  for (const [role, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10)
    const result = await prisma.user.updateMany({
      where: { role },
      data: { passwordHash: hash },
    })
    console.log(`✓ ${role}: reset ${result.count} user(s)`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
