import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DCM_USERS = [
  { name: "Rtr. Manthan Doshi", email: "rtr.manthandoshi@gmail.com" },
  { name: "Rtr. Mariam Mapari", email: "rtr.mariamapari03@gmail.com" },
  { name: "Rtr. Maryam Aarbi", email: "rtr.maryamaarbi@gmail.com" },
  { name: "Rtr. Sarah Patrawala", email: "sarahpatrawalarckc@gmail.com" },
  { name: "Rtr. Sumit Sharma", email: "rtr.sumeena03@gmail.com" },
  { name: "Rtr. Vedanti Khandke", email: "khandkevedanti273@gmail.com" },
  { name: "Rtr. Vinayak S Ambat", email: "rtr.vinayakambat@gmail.com" },
  { name: "Rtr. Aszad Khan", email: "rtr.aszadkhan@gmail.com" },
  { name: "Rtr. Yajat Raheja", email: "yajatraheja20@gmail.com" },
  { name: "Rtr. Deepak Gupta", email: "rtr.deepkg30@gmail.com" },
  { name: "Rtr. Raynard Chettiar", email: "chettiarraynard@gmail.com" },
  // Rtr. Romil Henia — no email provided, skipped
  { name: "Rtr. Adith Iyer", email: "rtnadithiyer@gmail.com" },
  { name: "Rtr. Aditya Mishra", email: "adityasmishra68@gmail.com" },
  { name: "Rtr. Khushi Modi", email: "khushikmodi19@gmail.com" },
  { name: "Rtr. Love Khakhar", email: "lkhakhar9833@gmail.com" },
  { name: "Rtr. Sayam Parekh", email: "parekhsayam@gmail.com" },
  { name: "Rtr. Faiz Baig", email: "fb842002@gmail.com" },
  { name: "Rtr. Surbhi Oberai", email: "surbhioberai2002@gmail.com" },
  { name: "Rtr. Dhairya Doshi", email: "rtr.dhairyadoshi@gmail.com" },
  { name: "Rtr. Mohammed Wardhawala", email: "mohammedwardhawalarckc@gmail.com" },
  { name: "Rtr. Purav Shah", email: "puravshah2105@gmail.com" },
  { name: "Rtr. Sudiksha Kapoor", email: "rtr.sudikshakapoor@gmail.com" },
  { name: "Rtr. Amit Singh", email: "amitajay24@gmail.com" },
  { name: "Rtr. Hejal Nyaynit", email: "hejalny@gmail.com" },
  { name: "Rtr. Dr. Yash Takodara", email: "yashtakodara@gmail.com" },
  { name: "Rtr. Gargi Patil", email: "rtrgargi16@gmail.com" },
  { name: "Rtr. Harshita Sawant", email: "rtr.harshita11@gmail.com" },
  { name: "Rtr. Smit Shah", email: "shahsmit2121@gmail.com" },
  { name: "Rtr. Srushti Jagtap", email: "shrushtijagtap55@gmail.com" },
  { name: "Rtr. Tanvi Mahale", email: "rtr.tanvimahale@gmail.com" },
  { name: "Rtr. Nirav Joshi", email: "rtr.niravjoshi@gmail.com" },
  { name: "Rtr. Poojan Sanchala", email: "poojansanchala167@gmail.com" },
  { name: "Rtr. Phreesha Udani", email: "phreesha2204@gmail.com" },
  { name: "Rtr. Twisha Shah", email: "rtrtwishashah@gmail.com" },
  { name: "Rtr. Lavanaya Nayak", email: "lavanyanayakrckc@gmail.com" },
  { name: "Rtr. Richa Ghosh", email: "richaghosh1007@gmail.com" },
  { name: "Rtr. Saahil Noronha", email: "noronhasaahilimp@gmail.com" },
  { name: "Rtr. Shweta Deshmukh", email: "rtr.shweta.deshmukh1506@gmail.com" },
  { name: "Rtr. Prajna Shetty", email: "rtrprajnashetty@gmail.com" },
  { name: "Rtr. Rashmi Amin", email: "rtr.rashmiamin@gmail.com" },
  { name: "Rtr. Shalank Kamble", email: "shalankkamble003@gmail.com" },
  { name: "Rtr. Achint Kaur", email: "rtr.achintkaur@gmail.com" },
  { name: "Rtr. Burhanuddin Fatehi", email: "rcc.president25.26@gmail.com" },
  { name: "Rtr. Khushi Pandey", email: "rtrkhushipandey@gmail.com" },
  { name: "Rtr. Jainam Rita", email: "rtajainam08@gmail.com" },
  { name: "Rtr. Samrudh Dave", email: "samrudhdave007@gmail.com" },
  { name: "Rtr. Aaryan Gupta", email: "rtr.aaryangupta@gmail.com" },
  { name: "Rtr. Aditya Acharya", email: "adityaacharya975@gmail.com" },
  { name: "Rtr. Neer Butola", email: "neerbutola08@gmail.com" },
  { name: "Rtr. Saee Jadhav", email: "saeejadhav24@gmail.com" },
  { name: "Rtr. Sumit Yadav", email: "sumitdharmendrayadav@gmail.com" },
  { name: "Rtr. Priyal Shah", email: "priyalshahrcba@gmail.com" },
  { name: "Rtr. Raunak Agarwal", email: "rtr.raunakagrawal@gmail.com" },
  { name: "Rtr. Reeya Bhojani", email: "reeyabhojani1234@gmail.com" },
  { name: "Rtr. Trissha Desai", email: "trisshadesai@gmail.com" },
  { name: "Rtr. Karan Parmar", email: "karan34parmar@gmail.com" },
  { name: "Rtr. Nausheen Tanasha", email: "rtr.nausheen.ft23@gmail.com" },
  { name: "Rtr. Pranjal Sharma", email: "rtr.pranjal05@gmail.com" },
  { name: "Rtr. Revathi Ramesh", email: "itsrevathi23@gmail.com" },
  { name: "Rtr. Rishika Nambiar", email: "rishikanambiar29@gmail.com" },
  { name: "Rtr. Bhavesh Pandey", email: "rtr.bhaveshpandey.01@gmail.com" },
  { name: "Rtr. Shubham Kumar Yadav", email: "rtr.shubhamkr.yadav@gmail.com" },
  { name: "Rtr. Tejas Katkar", email: "tejassk1555@gmail.com" },
  { name: "Rtr. Kushal Hinduja", email: "khushalkt@gmail.com" },
  { name: "Rtr. Pari Chaurasiya", email: "chaurasiaparirckc@gmail.com" },
  { name: "Rtr. Sania Kadam", email: "rtr.saniakadam.rcbw@gmail.com" },
  { name: "Rtr. Adith Iyer", email: "rtradithiyer@gmail.com" },
  { name: "Rtr. Harsh Vichare", email: "harshvichare007@gmail.com" },
  { name: "Rtr. Shlok Thakkar", email: "rtrshlokthakkar24@gmail.com" },
  { name: "Rtr. Siddhi Jain", email: "rtrsiddhi26@gmail.com" },
  { name: "Rtr. Palak Devnani", email: "palak.devnanijhc@gmail.com" },
  { name: "Rtr. Bhoomi Gawad", email: "bhoomigawad.rcruia09@gmail.com" },
  { name: "Rtr. Premprakash Prajapati", email: "rtr.premprajapati@gmail.com" },
  { name: "Rtr. Sanjana Sardesai", email: "rtr.sanjanasardesai@gmail.com" },
  { name: "Rtr. Subhiksha Koundanya", email: "rtr.subhikshakoundinya@gmail.com" },
  { name: "Rtr. Ibrahim Pittalwala", email: "ibrahimpittalwala4@gmail.com" },
  { name: "Rtr. Prathamesh Singh", email: "prathameshsingh1111@gmail.com" },
  { name: "Rtr. Sahana Shetty", email: "sahanashetty0702@gmail.com" },
  { name: "Rtr. Shah Alam Khan", email: "rtr.shahalamkhan@gmail.com" },
  { name: "Rtr. Shivam Jadhav", email: "shivamsjadhav7@gmail.com" },
  { name: "Rtr. Trisha Shetty", email: "rtr.trishashetty@gmail.com" },
  { name: "Rtr. Hrishita Sikarwar", email: "hrishitasikarwarrckc@gmail.com" },
  { name: "Rtr. Gungun Deka", email: "rtr.gungundeka@gmail.com" },
  { name: "Rtr. Kasturi Khutale", email: "kasturikhutale.rcruia28@gmail.com" },
  { name: "Rtr. Vibhay Singh", email: "singhvibhay64@gmail.com" },
  { name: "Rtr. Jash Bhatia", email: "rotaract.jash@gmail.com" },
  { name: "Rtr. Yash Mitra", email: "rtryashmitra2002@gmail.com" },
  { name: "Rtr. Amar Singh", email: "rtr.amarsingh@gmail.com" },
  { name: "Rtr. Ambresh Shukla", email: "rtr.ambreshshukla@gmail.com" },
  { name: "Rtr. Aarav Jain", email: "jainaarav111405@gmail.com" },
  { name: "Rtr. Nirbhay Oberai", email: "nirbhay020604@gmail.com" },
  { name: "Rtr. Bhushan Pawar", email: "rtr.bhushan08@gmail.com" },
  { name: "Rtr. Khalil Shaikh", email: "khalilshaikhwod@gmail.com" },
];

async function main() {
  const passwordHash = await bcrypt.hash("district3141", 10);
  let created = 0;
  let skipped = 0;

  for (const dcm of DCM_USERS) {
    const email = dcm.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`SKIP (exists): ${email}`);
      skipped++;
      continue;
    }
    await prisma.user.create({
      data: {
        name: dcm.name,
        email,
        passwordHash,
        role: "DCM",
        isActive: true,
      },
    });
    console.log(`CREATED: ${dcm.name} — ${email}`);
    created++;
  }

  console.log(`\nDone. Created: ${created} | Skipped (already exist): ${skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
