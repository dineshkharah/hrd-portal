import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function toSlug(name: string): string {
  // Strip "Rotaract Club of " prefix (case-insensitive)
  let n = name.replace(/^rotaract\s+club\s+of\s+/i, '').trim()

  const words = n.split(/\s+/).filter(Boolean)

  let slug: string
  if (words.length <= 2) {
    // 1-2 words: join directly, lowercase, strip non-alphanumeric
    slug = words.join('').toLowerCase().replace(/[^a-z0-9]/g, '')
  } else {
    // 3+ words: use acronym
    slug = words.map(w => w[0].toLowerCase()).join('')
  }

  return slug || 'club'
}

async function main() {
  const clubs = await prisma.user.findMany({
    where: { role: 'CLUB' },
    select: { id: true, email: true, name: true },
    orderBy: { name: 'asc' },
  })

  console.log(`Found ${clubs.length} club users\n`)

  // Separate already-correct emails from ones needing changes
  const needsUpdate = clubs.filter(c => !c.email.startsWith('rc.') || !c.email.endsWith('@district3141.com'))
  const alreadyCorrect = clubs.filter(c => c.email.startsWith('rc.') && c.email.endsWith('@district3141.com'))

  console.log(`Already correct: ${alreadyCorrect.length}`)
  console.log(`Needs update: ${needsUpdate.length}\n`)

  // Build a set of all emails that will exist (keep already-correct ones)
  const usedEmails = new Set(alreadyCorrect.map(c => c.email))

  const updates: { id: string; oldEmail: string; newEmail: string; name: string }[] = []

  for (const club of needsUpdate) {
    const slug = toSlug(club.name ?? club.email)
    let candidate = `rc.${slug}@district3141.com`

    // If collision, append a number
    let i = 2
    while (usedEmails.has(candidate)) {
      candidate = `rc.${slug}${i}@district3141.com`
      i++
    }

    usedEmails.add(candidate)
    updates.push({ id: club.id, oldEmail: club.email, newEmail: candidate, name: club.name ?? '' })
  }

  // Preview
  console.log('CHANGES PREVIEW:')
  updates.forEach(u => console.log(`  ${u.name}\n    ${u.oldEmail} → ${u.newEmail}`))

  // Apply
  console.log('\nApplying...')
  for (const u of updates) {
    await prisma.user.update({ where: { id: u.id }, data: { email: u.newEmail } })
  }
  console.log(`\n✓ Updated ${updates.length} club emails`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
