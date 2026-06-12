/**
 * AssetFlow database seed.
 * Creates demo accounts, the Cultural Council asset categories, a realistic
 * inventory, and a spread of bookings in different lifecycle states so the
 * dashboard and analytics have meaningful data on first run.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding AssetFlow database...");

  // Clean slate (order respects foreign keys).
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users ----
  const adminPass = await bcrypt.hash("admin123", 10);
  const userPass = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.create({
    data: { name: "Aarav Sharma", email: "admin@assetflow.dev", passwordHash: adminPass, role: "ADMIN" },
  });
  const ananya = await prisma.user.create({
    data: { name: "Ananya Verma", email: "ananya@assetflow.dev", passwordHash: userPass, role: "USER" },
  });
  const rohan = await prisma.user.create({
    data: { name: "Rohan Mehta", email: "rohan@assetflow.dev", passwordHash: userPass, role: "USER" },
  });
  const isha = await prisma.user.create({
    data: { name: "Isha Nair", email: "isha@assetflow.dev", passwordHash: userPass, role: "USER" },
  });

  // ---- Categories (from the problem statement) ----
  const categoryData = [
    { name: "DSLR Cameras", description: "Professional cameras and lenses for photography." },
    { name: "Studio Lighting", description: "Softboxes, LED panels and lighting stands." },
    { name: "Audio Systems", description: "Speakers, mixers and PA systems." },
    { name: "Costumes", description: "Performance and theatre costumes." },
    { name: "Stage Props", description: "Props and set pieces for stage events." },
    { name: "Recording Equipment", description: "Microphones, recorders and accessories." },
    { name: "Event Infrastructure", description: "Tents, tables, barricades and staging." },
  ];
  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const created = await prisma.category.create({ data: c });
    categories[c.name] = created.id;
  }

  // ---- Assets ----
  const assetData = [
    { name: "Canon EOS 90D DSLR", cat: "DSLR Cameras", qty: 6, condition: "EXCELLENT", location: "Media Room A", desc: "32.5MP APS-C DSLR, great for events and portraits." },
    { name: "Nikon D7500 DSLR", cat: "DSLR Cameras", qty: 4, condition: "GOOD", location: "Media Room A", desc: "20.9MP DSLR with 4K video." },
    { name: "Canon 50mm f/1.8 Lens", cat: "DSLR Cameras", qty: 5, condition: "GOOD", location: "Media Room A", desc: "Prime lens for low-light and portraits." },
    { name: "Godox SL-60W LED Light", cat: "Studio Lighting", qty: 8, condition: "GOOD", location: "Studio 1", desc: "60W continuous LED studio light." },
    { name: "Softbox 80cm", cat: "Studio Lighting", qty: 10, condition: "GOOD", location: "Studio 1", desc: "Light diffuser softbox with stand." },
    { name: "JBL EON615 Speaker", cat: "Audio Systems", qty: 6, condition: "EXCELLENT", location: "Audio Store", desc: "1000W powered PA speaker." },
    { name: "Yamaha MG12XU Mixer", cat: "Audio Systems", qty: 3, condition: "GOOD", location: "Audio Store", desc: "12-channel analog mixing console." },
    { name: "Theatre Costume Set (Royal)", cat: "Costumes", qty: 12, condition: "FAIR", location: "Wardrobe", desc: "Royal-era costumes for drama productions." },
    { name: "Folk Dance Costume Set", cat: "Costumes", qty: 20, condition: "GOOD", location: "Wardrobe", desc: "Traditional folk dance attire." },
    { name: "Wooden Throne Prop", cat: "Stage Props", qty: 2, condition: "GOOD", location: "Prop Room", desc: "Decorative throne for stage productions." },
    { name: "Stage Pillars (pair)", cat: "Stage Props", qty: 4, condition: "FAIR", location: "Prop Room", desc: "Greek-style decorative pillars." },
    { name: "Rode NT1 Microphone", cat: "Recording Equipment", qty: 5, condition: "EXCELLENT", location: "Recording Booth", desc: "Studio condenser microphone." },
    { name: "Zoom H6 Recorder", cat: "Recording Equipment", qty: 4, condition: "GOOD", location: "Recording Booth", desc: "6-track portable field recorder." },
    { name: "Canopy Tent 10x10", cat: "Event Infrastructure", qty: 15, condition: "GOOD", location: "Storage Yard", desc: "Outdoor event canopy tent." },
    { name: "Folding Banquet Table", cat: "Event Infrastructure", qty: 40, condition: "GOOD", location: "Storage Yard", desc: "6ft folding event table." },
    { name: "Crowd Barricade", cat: "Event Infrastructure", qty: 30, condition: "FAIR", location: "Storage Yard", desc: "Steel crowd-control barricade." },
  ];

  const assets: Record<string, { id: string; qty: number }> = {};
  for (const a of assetData) {
    const created = await prisma.asset.create({
      data: {
        name: a.name,
        description: a.desc,
        categoryId: categories[a.cat],
        totalQuantity: a.qty,
        availableQuantity: a.qty,
        condition: a.condition,
        location: a.location,
        status: "AVAILABLE",
      },
    });
    assets[a.name] = { id: created.id, qty: a.qty };
  }

  // ---- Bookings across the lifecycle (keeps inventory counts consistent) ----
  // Helper to reserve units on the asset for approved/issued/overdue bookings.
  async function reserve(assetId: string, quantity: number) {
    await prisma.asset.update({
      where: { id: assetId },
      data: { availableQuantity: { decrement: quantity } },
    });
  }

  // PENDING request — awaiting admin review.
  await prisma.booking.create({
    data: {
      userId: ananya.id,
      assetId: assets["Canon EOS 90D DSLR"].id,
      quantity: 2,
      startDate: daysFromNow(2),
      endDate: daysFromNow(5),
      purpose: "Photography for the cultural fest opening ceremony.",
      status: "PENDING",
    },
  });
  await prisma.booking.create({
    data: {
      userId: rohan.id,
      assetId: assets["JBL EON615 Speaker"].id,
      quantity: 2,
      startDate: daysFromNow(3),
      endDate: daysFromNow(4),
      purpose: "Audio setup for the music night.",
      status: "PENDING",
    },
  });

  // APPROVED — reserved, not yet issued.
  const approved = await prisma.booking.create({
    data: {
      userId: isha.id,
      assetId: assets["Folk Dance Costume Set"].id,
      quantity: 10,
      startDate: daysFromNow(1),
      endDate: daysFromNow(6),
      purpose: "Folk dance group performance.",
      status: "APPROVED",
      reviewedById: admin.id,
      reviewNote: "Approved — please collect from the wardrobe.",
    },
  });
  await reserve(approved.assetId, approved.quantity);

  // ISSUED — currently in use, due in the future.
  const issued = await prisma.booking.create({
    data: {
      userId: ananya.id,
      assetId: assets["Rode NT1 Microphone"].id,
      quantity: 2,
      startDate: daysFromNow(-2),
      endDate: daysFromNow(3),
      purpose: "Podcast recording sessions.",
      status: "ISSUED",
      reviewedById: admin.id,
      issuedAt: daysFromNow(-2),
      dueDate: daysFromNow(3),
    },
  });
  await reserve(issued.assetId, issued.quantity);

  // OVERDUE — issued, past its due date.
  const overdue = await prisma.booking.create({
    data: {
      userId: rohan.id,
      assetId: assets["Zoom H6 Recorder"].id,
      quantity: 1,
      startDate: daysFromNow(-10),
      endDate: daysFromNow(-3),
      purpose: "Field recording for documentary.",
      status: "OVERDUE",
      reviewedById: admin.id,
      issuedAt: daysFromNow(-10),
      dueDate: daysFromNow(-3),
    },
  });
  await reserve(overdue.assetId, overdue.quantity);

  // RETURNED — completed history (no reservation, inventory already restored).
  await prisma.booking.create({
    data: {
      userId: isha.id,
      assetId: assets["Canon EOS 90D DSLR"].id,
      quantity: 1,
      startDate: daysFromNow(-20),
      endDate: daysFromNow(-15),
      purpose: "Photo walk event coverage.",
      status: "RETURNED",
      reviewedById: admin.id,
      issuedAt: daysFromNow(-20),
      dueDate: daysFromNow(-15),
      returnedAt: daysFromNow(-15),
    },
  });
  await prisma.booking.create({
    data: {
      userId: ananya.id,
      assetId: assets["Canopy Tent 10x10"].id,
      quantity: 4,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(-25),
      purpose: "Outdoor stalls for fest.",
      status: "RETURNED",
      reviewedById: admin.id,
      issuedAt: daysFromNow(-30),
      dueDate: daysFromNow(-25),
      returnedAt: daysFromNow(-24),
    },
  });

  // REJECTED — record for history.
  await prisma.booking.create({
    data: {
      userId: rohan.id,
      assetId: assets["Wooden Throne Prop"].id,
      quantity: 2,
      startDate: daysFromNow(1),
      endDate: daysFromNow(2),
      purpose: "Skit.",
      status: "REJECTED",
      reviewedById: admin.id,
      reviewNote: "Reserved for the main drama production on the same dates.",
    },
  });

  // ---- A maintenance/damage record ----
  await prisma.maintenanceRecord.create({
    data: {
      assetId: assets["Stage Pillars (pair)"].id,
      type: "DAMAGE_REPORT",
      status: "OPEN",
      description: "One pillar has a cracked base after the last event.",
      reportedById: admin.id,
    },
  });

  // ---- A welcome notification for each user ----
  for (const u of [ananya, rohan, isha]) {
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: "INFO",
        title: "Welcome to AssetFlow",
        message: "Browse the catalog and request the assets you need for your events.",
      },
    });
  }

  console.log("Seed complete.");
  console.log("\n  Demo accounts:");
  console.log("   Admin -> admin@assetflow.dev / admin123");
  console.log("   User  -> ananya@assetflow.dev / user123");
  console.log("   User  -> rohan@assetflow.dev / user123");
  console.log("   User  -> isha@assetflow.dev / user123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
