import express from "express";
import {
  authRequired,
  requireRole,
  requireAnyRole,
} from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  registerLaptopForStudent,
  getLaptopsForStudent,
  getLaptopByIdService,
  updateLaptopInfo,
  deleteLaptop,
  findLaptopBySerial,
  listAllLaptopsWithStudent,
} from "../services/laptop.service.js";
import {
  uploadLaptopImages,
  getLaptopImages,
  deleteLaptopImage,
} from "../services/laptopImage.service.js";

export const laptopsRouter = express.Router();

// POST /api/students/:studentId/laptops - Register laptop for student (Admin)
laptopsRouter.post(
  "/students/:studentId/laptops",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const {
        brand,
        model,
        serialNumber,
        macAddress,
        color,
        purchaseYear,
        notes,
      } = req.body;

      const { laptop, student } = await registerLaptopForStudent({
        studentId,
        brand,
        model,
        serialNumber,
        macAddress,
        color,
        purchaseYear,
        notes,
        userId: req.user.id,
      });

      res.status(201).json({ laptop, student });
    } catch (err) {
      console.error("registerLaptop error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to register laptop" });
    }
  },
);

// GET /api/students/:studentId/laptops - Laptops for student (Admin, Security)
laptopsRouter.get(
  "/students/:studentId/laptops",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const result = await getLaptopsForStudent({ studentId });
      res.json(result);
    } catch (err) {
      console.error("getStudentLaptops error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get student laptops" });
    }
  },
);

// GET /api/laptops - List all laptops (Admin)
laptopsRouter.get(
  "/laptops",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const laptops = await listAllLaptopsWithStudent();
      res.json({ laptops });
    } catch (err) {
      console.error("listLaptops error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to list laptops" });
    }
  },
);

// GET /api/laptops/:laptopId - Laptop details (Admin, Security)
laptopsRouter.get(
  "/laptops/:laptopId",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const { laptopId } = req.params;
      const { laptop, student } = await getLaptopByIdService({ laptopId });
      res.json({ laptop, student });
    } catch (err) {
      console.error("getLaptop error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get laptop" });
    }
  },
);

// PUT /api/laptops/:laptopId - Update laptop (Admin)
laptopsRouter.put(
  "/laptops/:laptopId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { laptopId } = req.params;
      const {
        brand,
        model,
        serialNumber,
        macAddress,
        color,
        purchaseYear,
        notes,
      } = req.body;

      const updated = await updateLaptopInfo({
        laptopId,
        brand,
        model,
        serialNumber,
        macAddress,
        color,
        purchaseYear,
        notes,
        userId: req.user.id,
      });

      res.json({ laptop: updated });
    } catch (err) {
      console.error("updateLaptop error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update laptop" });
    }
  },
);

// DELETE /api/laptops/:laptopId - Delete laptop and images (Admin)
laptopsRouter.delete(
  "/laptops/:laptopId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { laptopId } = req.params;
      const deleted = await deleteLaptop({ laptopId });
      res.json({
        laptop: deleted,
        message: "Laptop and associated images deleted",
      });
    } catch (err) {
      console.error("deleteLaptop error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to delete laptop" });
    }
  },
);

// GET /api/laptops/serial/:serialNumber - Find by serial (Admin, Security)
laptopsRouter.get(
  "/laptops/serial/:serialNumber",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const { serialNumber } = req.params;
      const laptop = await findLaptopBySerial({ serialNumber });
      res.json({ laptop });
    } catch (err) {
      console.error("findLaptopBySerial error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to find laptop by serial" });
    }
  },
);

// POST /api/laptops/:laptopId/images - Upload images (Admin)
laptopsRouter.post(
  "/laptops/:laptopId/images",
  authRequired,
  requireRole("admin"),
  upload.array("images", 10),
  async (req, res) => {
    try {
      const { laptopId } = req.params;
      const { imageType } = req.body;
      const files = req.files || [];

      if (!imageType) {
        return res.status(400).json({ message: "imageType is required" });
      }
      if (!files.length) {
        return res
          .status(400)
          .json({ message: "At least one image file is required" });
      }

      const images = await uploadLaptopImages({
        laptopId,
        imageType,
        files,
        userId: req.user.id,
      });

      res.status(201).json({ images });
    } catch (err) {
      console.error("uploadLaptopImages error", err);
      const status =
        err.message && err.message.includes("Only JPEG and PNG")
          ? 400
          : err.status || 500;
      res
        .status(status)
        .json({ message: err.message || "Failed to upload images" });
    }
  },
);

// GET /api/laptops/:laptopId/images - List images (Admin, Security)
laptopsRouter.get(
  "/laptops/:laptopId/images",
  authRequired,
  requireAnyRole(["admin", "security"]),
  async (req, res) => {
    try {
      const { laptopId } = req.params;
      const images = await getLaptopImages({ laptopId });
      res.json({ images });
    } catch (err) {
      console.error("getLaptopImages error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get laptop images" });
    }
  },
);

// DELETE /api/laptops/:laptopId/images/:imageId - Delete image (Admin)
laptopsRouter.delete(
  "/laptops/:laptopId/images/:imageId",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { laptopId, imageId } = req.params;
      const deleted = await deleteLaptopImage({ laptopId, imageId });
      res.json({ image: deleted, message: "Image deleted" });
    } catch (err) {
      console.error("deleteLaptopImage error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to delete laptop image" });
    }
  },
);
