import express from "express";
import {
  authRequired,
  requireRole,
  requireAnyRole,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { studentValidations } from "../middleware/validation.middleware.js";
import {
  registerStudent,
  getStudentByStudentId,
  updateStudentInfo,
  softDeleteStudentRecord,
  listStudentsPaged,
  searchStudentsPaged,
  getStudentsByDepartment,
} from "../services/student.service.js";

export const studentsRouter = express.Router();

// POST /api/students - Register new student (Admin)
studentsRouter.post(
  "/",
  authRequired,
  requireRole("admin"),
  validate(studentValidations.register),
  async (req, res) => {
    try {
      const {
        studentId,
        fullName,
        yearOfEntry,
        gender,
        department,
        email,
        phone,
      } = req.body;

      const student = await registerStudent({
        studentId,
        fullName,
        yearOfEntry: parseInt(yearOfEntry),
        gender,
        department,
        email,
        phone,
        userId: req.user.id,
      });

      res.status(201).json({ student });
    } catch (err) {
      console.error("registerStudent error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to register student" });
    }
  },
);

// GET /api/students - List students with pagination/filter/sort (Admin, Security)
studentsRouter.get(
  "/",
  authRequired,
  requireAnyRole(["admin", "security"]),
  validate(studentValidations.list),
  async (req, res) => {
    try {
      const {
        page,
        limit,
        department,
        yearOfEntry,
        isActive,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await listStudentsPaged({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
        department,
        yearOfEntry: yearOfEntry ? parseInt(yearOfEntry) : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        sortBy,
        sortOrder,
      });

      res.json(result);
    } catch (err) {
      console.error("listStudents error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to list students" });
    }
  },
);

// GET /api/students/:studentId - Get specific student (Admin, Security)
studentsRouter.get(
  "/:studentId",
  authRequired,
  requireAnyRole(["admin", "security"]),
  validate(studentValidations.getByStudentId),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await getStudentByStudentId({ studentId });
      res.json({ student });
    } catch (err) {
      console.error("getStudent error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to get student" });
    }
  },
);

// PUT /api/students/:studentId - Update student (Admin)
studentsRouter.put(
  "/:studentId",
  authRequired,
  requireRole("admin"),
  validate(studentValidations.update),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { fullName, yearOfEntry, gender, department, email, phone } =
        req.body;

      const updated = await updateStudentInfo({
        studentId,
        fullName,
        yearOfEntry: yearOfEntry ? parseInt(yearOfEntry) : undefined,
        gender,
        department,
        email,
        phone,
        userId: req.user.id,
      });

      res.json({ student: updated });
    } catch (err) {
      console.error("updateStudent error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to update student" });
    }
  },
);

// DELETE /api/students/:studentId - Soft delete (Admin)
studentsRouter.delete(
  "/:studentId",
  authRequired,
  requireRole("admin"),
  validate(studentValidations.getByStudentId),
  async (req, res) => {
    try {
      const { studentId } = req.params;

      const deleted = await softDeleteStudentRecord({
        studentId,
        userId: req.user.id,
      });

      res.json({
        student: deleted,
        message: "Student soft-deleted (inactive)",
      });
    } catch (err) {
      console.error("deleteStudent error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to delete student" });
    }
  },
);

// GET /api/students/search/by - Search by name, department, year (Admin, Security)
studentsRouter.get(
  "/search/by",
  authRequired,
  requireAnyRole(["admin", "security"]),
  validate(studentValidations.search),
  async (req, res) => {
    try {
      const { q, department, yearOfEntry, page, limit } = req.query;

      const result = await searchStudentsPaged({
        q,
        department,
        yearOfEntry: yearOfEntry ? parseInt(yearOfEntry) : undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      });
      res.json(result);
    } catch (err) {
      console.error("searchStudents error", err);
      res
        .status(err.status || 500)
        .json({ message: err.message || "Failed to search students" });
    }
  },
);

// GET /api/students/department/:dept - Students by department (Admin)
studentsRouter.get(
  "/department/:dept",
  authRequired,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { dept } = req.params;

      const students = await getStudentsByDepartment({ department: dept });
      res.json({ students });
    } catch (err) {
      console.error("studentsByDepartment error", err);
      res
        .status(err.status || 500)
        .json({
          message: err.message || "Failed to get students by department",
        });
    }
  },
);