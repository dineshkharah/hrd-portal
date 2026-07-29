import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const avenues = [
  { name: 'Team DRS', slug: 'team-drs', displayOrder: 1, param6Label: 'Secretarial Accuracy', param7Label: 'Communication Timeliness' },
  { name: 'Finance', slug: 'finance', displayOrder: 2, param6Label: 'Budget Adherence', param7Label: 'Financial Reporting Quality' },
  { name: 'Events & Fellowship', slug: 'events-fellowship', displayOrder: 3, param6Label: 'Event Execution Quality', param7Label: 'Attendance & Engagement' },
  { name: 'Mega Events', slug: 'mega-events', displayOrder: 4, param6Label: 'Large-Scale Coordination', param7Label: 'Stakeholder Satisfaction' },
  { name: 'Community Service', slug: 'community-service', displayOrder: 5, param6Label: 'Project Execution', param7Label: 'Community Impact' },
  { name: 'International Service', slug: 'international-service', displayOrder: 6, param6Label: 'International Linkages', param7Label: 'Cultural Exchange Activity' },
  { name: 'Professional Development', slug: 'professional-development', displayOrder: 7, param6Label: 'Session Quality', param7Label: 'Participant Feedback Score' },
  { name: 'Sports', slug: 'sports', displayOrder: 8, param6Label: 'Event Organisation', param7Label: 'Participation Rate' },
  { name: 'Entrepreneurship Development', slug: 'entrepreneurship-development', displayOrder: 9, param6Label: 'Initiative Quality', param7Label: 'Ecosystem Engagement' },
  { name: 'Public Relations & Marketing', slug: 'public-relations-marketing', displayOrder: 10, param6Label: 'Media Coverage Quality', param7Label: 'Campaign Effectiveness' },
  { name: 'Partners in Service', slug: 'partners-in-service', displayOrder: 11, param6Label: 'Partnership Acquisition', param7Label: 'Partner Retention Rate' },
  { name: 'Digital Communications', slug: 'digital-communications', displayOrder: 12, param6Label: 'Content Output Quality', param7Label: 'Platform Engagement Rate' },
  { name: 'Publications', slug: 'publications', displayOrder: 13, param6Label: 'Publication Consistency', param7Label: 'Editorial Quality' },
  { name: 'Social Media', slug: 'social-media', displayOrder: 14, param6Label: 'Content Output Quality', param7Label: 'Reach & Engagement' },
  { name: 'Human Resource Development', slug: 'human-resource-development', displayOrder: 15, param6Label: 'HR Initiative Quality', param7Label: 'Member Satisfaction Score' },
  { name: 'Zones', slug: 'zones', displayOrder: 16, param6Label: 'Zone Coordination', param7Label: 'Club Engagement Rate' },
]

const dcmsByAvenue: Record<string, { name: string; title: string }[]> = {
  'team-drs': [
    { name: 'Manthan Doshi', title: 'Joint Secretary' },
    { name: 'Mariam Mapari', title: 'Joint Secretary' },
    { name: 'Maryam Aarbi', title: 'Joint Secretary' },
    { name: 'Sarah Patrawala', title: 'Joint Secretary' },
    { name: 'Sumit Sharma', title: 'Joint Secretary' },
    { name: 'Vedanti Khandke', title: 'Joint Secretary' },
    { name: 'Vinayak S Ambat', title: 'Joint Secretary' },
  ],
  'finance': [
    { name: 'Aszad Khan', title: 'Director' },
    { name: 'Yajat Raheja', title: 'Joint Director' },
  ],
  'events-fellowship': [
    { name: 'Faiz Baig', title: 'Director' },
    { name: 'Surbhi Oberai', title: 'Director' },
    { name: 'Dhairya Doshi', title: 'Joint Director' },
    { name: 'Mohammed Wardhawala', title: 'Joint Director' },
    { name: 'Purav Shah', title: 'Joint Director' },
    { name: 'Sudiksha Kapoor', title: 'Joint Director' },
  ],
  'mega-events': [
    { name: 'Deepak Gupta', title: 'Director' },
    { name: 'Adith Iyer', title: 'Joint Director' },
    { name: 'Aditya Mishra', title: 'Joint Director' },
    { name: 'Khushi Modi', title: 'Joint Director' },
    { name: 'Love Khakahr', title: 'Joint Director' },
    { name: 'Raynard Chettiar', title: 'Joint Director' },
    { name: 'Sayam Parekh', title: 'Joint Director' },
  ],
  'community-service': [
    { name: 'Amit Singh', title: 'Director' },
    { name: 'Dr. Yash Takodara', title: 'Director' },
    { name: 'Hejal Nyaynit', title: 'Director' },
    { name: 'Gargi Patil', title: 'Joint Director' },
    { name: 'Harshita Sawant', title: 'Joint Director' },
    { name: 'Smit Shah', title: 'Joint Director' },
    { name: 'Srushti Jagtap', title: 'Joint Director' },
    { name: 'Tanvi Mahale', title: 'Joint Director' },
  ],
  'international-service': [
    { name: 'Nirav Joshi', title: 'Director' },
    { name: 'Poojan Sanchala', title: 'Director' },
    { name: 'Preesha Udani', title: 'Director' },
    { name: 'Lavanaya Nayak', title: 'Joint Director' },
    { name: 'Richa Ghosh', title: 'Joint Director' },
    { name: 'Saahil Noronha', title: 'Joint Director' },
    { name: 'Twisha Shah', title: 'Joint Director' },
  ],
  'professional-development': [
    { name: 'Prajna Shetty', title: 'Director' },
    { name: 'Rashmi Amin', title: 'Director' },
    { name: 'Shweta Deshmukh', title: 'Joint Director' },
  ],
  'sports': [
    { name: 'Achint Kaur', title: 'Joint Director' },
    { name: 'Burhanuddin Fatehi', title: 'Joint Director' },
    { name: 'Shalank Kamble', title: 'Joint Director' },
  ],
  'entrepreneurship-development': [
    { name: 'Jainam Rita', title: 'Director' },
    { name: 'Aaryan Gupta', title: 'Joint Director' },
    { name: 'Aditya Acharya', title: 'Joint Director' },
    { name: 'Khushi Pandey', title: 'Joint Director' },
    { name: 'Neer Butola', title: 'Joint Director' },
    { name: 'Samrudh Dave', title: 'Joint Director' },
  ],
  'public-relations-marketing': [
    { name: 'Priyal Shah', title: 'Director' },
    { name: 'Saee Jadhav', title: 'Director' },
    { name: 'Raunak Agarwal', title: 'Joint Director' },
    { name: 'Reeya Bhojani', title: 'Joint Director' },
    { name: 'Sumit Yadav', title: 'Joint Director' },
    { name: 'Trissha Desai', title: 'Joint Director' },
  ],
  'partners-in-service': [
    { name: 'Karan Parmar', title: 'Joint Officer' },
    { name: 'Nausheen Tanasha', title: 'Joint Officer' },
    { name: 'Pranjal Sharma', title: 'Joint Officer' },
    { name: 'Revathi Ramesh', title: 'Joint Officer' },
    { name: 'Rishika Nambiar', title: 'Joint Officer' },
  ],
  'digital-communications': [
    { name: 'Adith Iyer', title: 'Director' },
    { name: 'Harsh Vichare', title: 'Joint Director' },
    { name: 'Shlok Thakkar', title: 'Joint Director' },
    { name: 'Siddhi Jain', title: 'Joint Director' },
    { name: 'Soham Shukla', title: 'Joint Director' },
  ],
  'publications': [
    { name: 'Bhavesh Pandey', title: 'Director' },
    { name: 'Shubham Kumar Yadav', title: 'Director' },
    { name: 'Tejas Katkar', title: 'Director' },
    { name: 'Kushal Hinduja', title: 'Joint Director' },
    { name: 'Pari Chaurasiya', title: 'Joint Director' },
    { name: 'Sania Kadam', title: 'Joint Director' },
    { name: 'Palak Devnani', title: 'Editor' },
    { name: 'Bhoomi Gawad', title: 'Joint Editor' },
    { name: 'Premprakash Prajapati', title: 'Joint Editor' },
    { name: 'Sanjana Sardesai', title: 'Joint Editor' },
    { name: 'Subhiksha Koundanya', title: 'Joint Editor' },
  ],
  'social-media': [
    { name: 'Saee Jadhav', title: 'Manager' },
    { name: 'Ibrahim Pittalwala', title: 'Joint Manager' },
    { name: 'Prathamesh Singh', title: 'Joint Manager' },
    { name: 'Sahana Shetty', title: 'Joint Manager' },
    { name: 'Sanjana Sardesai', title: 'Joint Manager' },
  ],
  'human-resource-development': [
    { name: 'Shah Alam Khan', title: 'Officer' },
    { name: 'Shivam Jadhav', title: 'Officer' },
    { name: 'Gungun Deka', title: 'Joint Officer' },
    { name: 'Hrishita Sikarwar', title: 'Joint Officer' },
    { name: 'Kasturi Khutale', title: 'Joint Officer' },
    { name: 'Trisha Shetty', title: 'Joint Officer' },
    { name: 'Vibhay Singh', title: 'Joint Officer' },
  ],
  'zones': [
    { name: 'Jash Bhatia', title: 'ZRR - Zone 1' },
    { name: 'Yash Mitra', title: 'ZRR - Zone 1' },
    { name: 'Amar Singh', title: 'ZRR - Zone 2' },
    { name: 'Ambresh Shukla', title: 'ZRR - Zone 2' },
    { name: 'Aarav Jain', title: 'ZRR - Zone 3' },
    { name: 'Nirbhay Oberai', title: 'ZRR - Zone 3' },
    { name: 'Bhushan Pawar', title: 'ZRR - Zone 4' },
    { name: 'Khalil Shaikh', title: 'ZRR - Zone 4' },
  ],
}

async function main() {
  console.log('🌱 Seeding database...')

  // District Settings
  await prisma.districtSettings.upsert({
    where: { id: 'singleton' },
    update: { activeMonth: 7, activeYear: 2026 },
    create: { id: 'singleton', activeMonth: 7, activeYear: 2026 },
  })
  console.log('✓ District settings')

  // Avenues
  const avenueIds: Record<string, string> = {}
  for (const avenue of avenues) {
    const record = await prisma.avenue.upsert({
      where: { name: avenue.name },
      update: { displayOrder: avenue.displayOrder, param6Label: avenue.param6Label, param7Label: avenue.param7Label, isActive: true },
      create: { name: avenue.name, displayOrder: avenue.displayOrder, param6Label: avenue.param6Label, param7Label: avenue.param7Label, isActive: true },
    })
    avenueIds[avenue.slug] = record.id
  }
  console.log('✓ Avenues (16)')

  // Hash passwords
  const hrdHash = await bcrypt.hash('HRD@3141', 10)
  const drrHash = await bcrypt.hash('DRR@3141', 10)
  const decHash = await bcrypt.hash('DEC@3141', 10)

  // HRD
  await prisma.user.upsert({
    where: { email: 'hrd@district3141.com' },
    update: { name: 'HRD Admin', passwordHash: hrdHash, role: 'HRD', isActive: true },
    create: { email: 'hrd@district3141.com', name: 'HRD Admin', passwordHash: hrdHash, role: 'HRD', isActive: true },
  })
  console.log('✓ HRD user')

  // DRR
  await prisma.user.upsert({
    where: { email: 'drr@district3141.com' },
    update: { name: 'DRR Officer', passwordHash: drrHash, role: 'DRR', isActive: true },
    create: { email: 'drr@district3141.com', name: 'DRR Officer', passwordHash: drrHash, role: 'DRR', isActive: true },
  })
  console.log('✓ DRR user')

  // DECs
  for (const avenue of avenues) {
    const avenueId = avenueIds[avenue.slug]
    const email = `dec.${avenue.slug}@district3141.com`
    await prisma.user.upsert({
      where: { email },
      update: { name: `DEC ${avenue.name}`, passwordHash: decHash, role: 'DEC', avenueId, isActive: true },
      create: { email, name: `DEC ${avenue.name}`, passwordHash: decHash, role: 'DEC', avenueId, isActive: true },
    })
  }
  console.log('✓ DEC users (16)')

  // DCMs
  const joinedAt = new Date('2025-07-01')
  let dcmCount = 0
  for (const avenue of avenues) {
    const avenueId = avenueIds[avenue.slug]
    const dcms = dcmsByAvenue[avenue.slug] ?? []
    for (const dcm of dcms) {
      const existing = await prisma.dcm.findFirst({ where: { name: dcm.name, avenueId } })
      if (existing) {
        await prisma.dcm.update({ where: { id: existing.id }, data: { title: dcm.title, isActive: true, joinedAt } })
      } else {
        await prisma.dcm.create({ data: { name: dcm.name, title: dcm.title, avenueId, isActive: true, joinedAt } })
      }
      dcmCount++
    }
  }
  console.log(`✓ DCMs (${dcmCount})`)
  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
