import {
  createLaptop,
  findLaptopById,
  findLaptopBySerialNumber,
  listLaptopsForStudent,
  updateLaptopById,
  deleteLaptopById,
} from "../models/laptop.model.js";
import { findStudentByStudentId } from "../models/student.model.js";
import { listImagesForLaptopRaw } from "../models/laptopImage.model.js";
import { cloudinary } from "../config/cloudinary.js";
import { query } from "../config/db.js";

const MAC_REGEX = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

function validateMacAddress(macAddress) {
  if (!macAddress) return;
  if (!MAC_REGEX.test(macAddress)) {
    const error = new Error("Invalid MAC address format");
    error.status = 400;
    throw error;
  }
}

function validatePurchaseYear(purchaseYear) {
  if (!purchaseYear) return;
  const year = Number(purchaseYear);
  const currentYear = new Date().getFullYear();
  if (Number.isNaN(year) || year < 1990 || year > currentYear) {
    const error = new Error("Invalid purchase year");
    error.status = 400;
    throw error;
  }
}

export async function registerLaptopForStudent({
  studentId,
  brand,
  model,
  serialNumber,
  macAddress,
  color,
  purchaseYear,
  notes,
  userId,
}) {
  if (!brand || !model || !serialNumber) {
    const error = new Error("brand, model, and serialNumber are required");
    error.status = 400;
    throw error;
  }

  validateMacAddress(macAddress);
  validatePurchaseYear(purchaseYear);

  const student = await findStudentByStudentId(studentId);
  if (!student || !student.is_active) {
    const error = new Error("Active student not found");
    error.status = 400;
    throw error;
  }

  const existingSerial = await findLaptopBySerialNumber(serialNumber);
  if (existingSerial) {
    const error = new Error("Serial number already exists");
    error.status = 409;
    throw error;
  }

  const laptop = await createLaptop({
    studentDbId: student.id,
    brand,
    model,
    serialNumber,
    macAddress,
    color,
    purchaseYear,
    notes,
    createdByUserId: userId,
  });

  return { laptop, student };
}

export async function getLaptopsForStudent({ studentId }) {
  const student = await findStudentByStudentId(studentId);
  if (!student) {
    const error = new Error("Student not found");
    error.status = 404;
    throw error;
  }
  const laptops = await listLaptopsForStudent({ studentDbId: student.id });
  return { student, laptops };
}

export async function getLaptopByIdService({ laptopId }) {
  const laptop = await findLaptopById(laptopId);
  if (!laptop) {
    const error = new Error("Laptop not found");
    error.status = 404;
    throw error;
  }
  return laptop;
}

export async function updateLaptopInfo({
  laptopId,
  brand,
  model,
  serialNumber,
  macAddress,
  color,
  purchaseYear,
  notes,
  userId,
}) {
  validateMacAddress(macAddress);
  validatePurchaseYear(purchaseYear);

  const existing = await findLaptopById(laptopId);
  if (!existing) {
    const error = new Error("Laptop not found");
    error.status = 404;
    throw error;
  }

  if (serialNumber && serialNumber !== existing.serial_number) {
    const serialOwner = await findLaptopBySerialNumber(serialNumber);
    if (serialOwner) {
      const error = new Error("Serial number already exists");
      error.status = 409;
      throw error;
    }
  }

  const updated = await updateLaptopById({
    id: laptopId,
    brand,
    model,
    serialNumber,
    macAddress,
    color,
    purchaseYear,
    notes,
    updatedByUserId: userId,
  });

  return updated;
}

export async function deleteLaptop({ laptopId }) {
  const laptop = await findLaptopById(laptopId);
  if (!laptop) {
    const error = new Error("Laptop not found");
    error.status = 404;
    throw error;
  }

  const images = await listImagesForLaptopRaw({ laptopId });

  for (const img of images) {
    if (img.cloudinary_public_id) {
      try {
        await cloudinary.uploader.destroy(img.cloudinary_public_id);
      } catch (err) {
        console.error(
          "Failed to delete Cloudinary image",
          img.cloudinary_public_id,
          err,
        );
      }
    }
  }

  const deleted = await deleteLaptopById(laptopId);
  return deleted;
}

export async function findLaptopBySerial({ serialNumber }) {
  const laptop = await findLaptopBySerialNumber(serialNumber);
  if (!laptop) {
    const error = new Error("Laptop not found");
    error.status = 404;
    throw error;
  }
  return laptop;
}

// List all laptops with basic student info for admin management UI
export async function listAllLaptopsWithStudent() {
  const result = await query(
    `SELECT
       l.id,
       l.student_id,
       l.brand,
       l.model,
       l.serial_number,
       l.mac_address,
       s.full_name AS student_full_name
     FROM laptops l
     LEFT JOIN students s ON s.id = l.student_id
     ORDER BY l.created_at DESC`,
  );
  return result.rows;
}
