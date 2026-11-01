
const express = require("express");
const Student = require("../models/Student");

const router = express.Router();

// GET: Dashboard statistics
// IMPORTANT: Keep this route before router.get("/:id")
router.get("/stats/summary", async (req, res) => {
  try {
    const students = await Student.find().lean();

    const totalStudents = students.length;

    const courses = [
      ...new Set(
        students
          .map((student) => student.course?.trim())
          .filter(Boolean)
      ),
    ];

    const courseCounts = {};
    const yearCounts = {};

    students.forEach((student) => {
      // Count students by course
      const course = student.course?.trim();

      if (course) {
        courseCounts[course] =
          (courseCounts[course] || 0) + 1;
      }

      // Count students by academic year
      const year = student.year;

      if (year !== undefined && year !== null && year !== "") {
        const yearLabel = `Year ${year}`;

        yearCounts[yearLabel] =
          (yearCounts[yearLabel] || 0) + 1;
      }
    });

    // Get five most recently added students
    const recentStudents = [...students]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        if (dateA !== dateB) {
          return dateB - dateA;
        }

        return String(b._id).localeCompare(String(a._id));
      })
      .slice(0, 5)
      .map((student) => ({
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        course: student.course,
        year: student.year,
      }));

    res.json({
      totalStudents,
      totalCourses: courses.length,
      courseCounts,
      yearCounts,
      recentStudents,
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    res.status(500).json({
      message: "Unable to load dashboard statistics",
    });
  }
});

// GET: Fetch all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({
      createdAt: -1,
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching students",
    });
  }
});

// POST: Add a new student
router.post("/", async (req, res) => {
  try {
    const student = await Student.create(req.body);

    res.status(201).json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Roll number or email already exists",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
});

// PUT: Update a student
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Roll number or email already exists",
      });
    }

    res.status(400).json({
      message: error.message,
    });
  }
});

// DELETE: Remove a student
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(
      req.params.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    res.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Unable to delete student",
    });
  }
});

module.exports = router;
