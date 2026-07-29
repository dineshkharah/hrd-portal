import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const fixes: { old: string; new: string }[] = [
  { old: 'rc.gesac&sc@district3141.com',   new: 'rc.gesacsc@district3141.com' },
  { old: 'rc.mvmcoc&s@district3141.com',   new: 'rc.mvmcocs@district3141.com' },
  { old: 'rc.⁠pis@district3141.com',  new: 'rc.pis@district3141.com' },
  { old: 'rc.⁠psijc@district3141.com',new: 'rc.psijc@district3141.com' },
  { old: 'rc.j-p@district3141.com',        new: 'rc.jesp@district3141.com' },
]

async function main() {
  for (const fix of fixes) {
    const user = await prisma.user.findUnique({ where: { email: fix.old } })
    if (!user) { console.log(`NOT FOUND: ${fix.old}`); continue }
    await prisma.user.update({ where: { email: fix.old }, data: { email: fix.new } })
    console.log(`✓ ${fix.old} → ${fix.new}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
