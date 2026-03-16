import { prisma } from "../config/prisma.js";

export async function createLaptop({
  studentDbId,
  brand,
  model,
  serialNumber,
  macAddress,
  color,
  purchaseYear,
  notes,
  createdByUserId,
}) {
  const laptop = await prisma.laptops.create({
    data: {
      student_id: studentDbId,
      brand,
      model,
      serial_number: serialNumber,
      mac_address: macAddress ?? null,
      color: color ?? null,
      purchase_year: purchaseYear ?? null,
      notes: notes ?? null,
      created_by_user_id: createdByUserId ?? null,
    },
  });
  return laptop;
}

export async function findLaptopById(id) {
  return prisma.laptops.findUnique({ where: { id } });
}

export async function findLaptopBySerialNumber(serialNumber) {
  return prisma.laptops.findUnique({ where: { serial_number: serialNumber } });
}

export async function listLaptopsForStudent({ studentDbId }) {
  return prisma.laptops.findMany({
    where: { student_id: studentDbId },
    orderBy: { created_at: "desc" },
  });
}

export async function updateLaptopById({
  id,
  brand,
  model,
  serialNumber,
  macAddress,
  color,
  purchaseYear,
  notes,
  updatedByUserId,
}) {
  const existing = await prisma.laptops.findUnique({ where: { id } });
  if (!existing) return null;

  const laptop = await prisma.laptops.update({
    where: { id },
    data: {
      brand: brand ?? existing.brand,
      model: model ?? existing.model,
      serial_number: serialNumber ?? existing.serial_number,
      mac_address: macAddress ?? existing.mac_address,
      color: color ?? existing.color,
      purchase_year: purchaseYear ?? existing.purchase_year,
      notes: notes ?? existing.notes,
      updated_by_user_id: updatedByUserId ?? null,
      updated_at: new Date(),
    },
  });

  return laptop;
}

export async function deleteLaptopById(id) {
  try {
    const laptop = await prisma.laptops.delete({ where: { id } });
    return laptop;
  } catch (err) {
    // Record not found
    if (err.code === "P2025") {
      return null;
    }
    throw err;
  }
}
