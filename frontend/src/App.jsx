
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./App.css";

const API = "http://localhost:5000/api/students";

const COLORS = [
  "#3478d4",
  "#20a486",
  "#f2a541",
  "#8b70d6",
  "#e56b6f",
  "#42a5c5",
];

const emptyForm = {
  name: "",
  rollNumber: "",
  email: "",
  course: "",
  year: "",
};

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all students
  async function loadStudents() {
    try {
      setLoading(true);
      const response = await axios.get(API);
      setStudents(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load students. Check your backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  // Handle form input
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Reset form
  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  // Add or update student
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const studentData = {
      name: form.name.trim(),
      rollNumber: form.rollNumber.trim(),
      email: form.email.trim(),
      course: form.course.trim(),
      year: Number(form.year),
    };

    try {
      if (editingId) {
        await axios.put(
          `${API}/${editingId}`,
          studentData
        );

        setMessage("Student details successfully updated!");
      } else {
        await axios.post(API, studentData);
        setMessage("Student successfully added!");
      }

      resetForm();
      await loadStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Operation failed. Please try again."
      );
    }
  }

  // Edit student
  function handleEdit(student) {
    setEditingId(student._id);

    setForm({
      name: student.name || "",
      rollNumber: student.rollNumber || "",
      email: student.email || "",
      course: student.course || "",
      year: String(student.year ?? ""),
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Delete student
  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${student.name}?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await axios.delete(`${API}/${student._id}`);

      if (editingId === student._id) {
        resetForm();
      }

      setMessage("Student successfully deleted!");
      await loadStudents();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete student."
      );
    }
  }

  // Dashboard statistics
  const courseCounts = {};
  const yearCounts = {};

  students.forEach((student) => {
    const course = student.course?.trim();

    if (course) {
      courseCounts[course] =
        (courseCounts[course] || 0) + 1;
    }

    if (
      student.year !== undefined &&
      student.year !== null &&
      student.year !== ""
    ) {
      const yearLabel = `Year ${student.year}`;

      yearCounts[yearLabel] =
        (yearCounts[yearLabel] || 0) + 1;
    }
  });

  const courseData = Object.entries(courseCounts).map(
    ([course, count]) => ({
      course,
      students: count,
    })
  );

  const yearData = Object.entries(yearCounts).map(
    ([year, count]) => ({
      year,
      students: count,
    })
  );

  // Recently added students
  const recentStudents = [...students]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      if (dateA !== dateB) return dateB - dateA;

      return String(b._id).localeCompare(String(a._id));
    })
    .slice(0, 5);

  // Search students
  const filteredStudents = students.filter((student) => {
    const query = search.trim().toLowerCase();

    return [
      student.name,
      student.rollNumber,
      student.email,
      student.course,
      student.year,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>Student Management System</h1>
          <p>Manage your student records in one place</p>
        </div>
      </header>

      <main className="container">

        {/* Dashboard */}
        <section className="dashboard">

          <div className="dashboard-heading">
            <div>
              <h2>Admin Dashboard</h2>
              <p>Overview of your student records</p>
            </div>

            <button
              type="button"
              className="dashboard-refresh"
              onClick={loadStudents}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>

          {/* Statistics */}
          <div className="stats dashboard-stats">

            <div className="stat-card">
              <span>Total Students</span>
              <h2>{students.length}</h2>
            </div>

            <div className="stat-card">
              <span>Total Courses</span>
              <h2>{courseData.length}</h2>
            </div>

            <div className="stat-card">
              <span>Academic Years</span>
              <h2>{yearData.length}</h2>
            </div>

          </div>

          {/* Bar Charts */}
          <div className="chart-grid">

            <div className="chart-card">
              <h3>Students by Course</h3>

              {courseData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={courseData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="course" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />

                    <Bar
                      dataKey="students"
                      fill="#3478d4"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>No course data available.</p>
              )}
            </div>

            <div className="chart-card">
              <h3>Students by Academic Year</h3>

              {yearData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={yearData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />

                    <Bar
                      dataKey="students"
                      fill="#20a486"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p>No year data available.</p>
              )}
            </div>

          </div>

          {/* Pie Chart */}
          <div className="chart-card course-distribution">
            <h3>Course Distribution</h3>

            {courseData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseData}
                    dataKey="students"
                    nameKey="course"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >
                    {courseData.map((entry, index) => (
                      <Cell
                        key={entry.course}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No course data available.</p>
            )}
          </div>

          {/* Recently Added Students */}
          <div className="recent-card">
            <h3>Recently Added Students</h3>

            {recentStudents.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Course</th>
                      <th>Year</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentStudents.map((student) => (
                      <tr key={student._id}>
                        <td>{student.name}</td>
                        <td>{student.rollNumber}</td>
                        <td>{student.course}</td>
                        <td>{student.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No students added yet.</p>
            )}
          </div>

        </section>

        {/* Add / Update Student */}
        <section className="panel">

          <h2>
            {editingId
              ? "Edit Student Details"
              : "Add New Student"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="student-form"
          >

            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <input
              name="rollNumber"
              placeholder="Roll Number"
              value={form.rollNumber}
              onChange={handleChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              name="course"
              placeholder="Course (e.g. BSc IT)"
              value={form.course}
              onChange={handleChange}
              required
            />

            <input
              name="year"
              type="number"
              placeholder="Year (e.g. 3)"
              min="1"
              max="6"
              value={form.year}
              onChange={handleChange}
              required
            />

            <div className="form-actions">

              <button type="submit" disabled={loading}>
                {editingId ? "Update Student" : "Add Student"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}

            </div>
          </form>

          {message && (
            <p className="message success-message">
              {message}
            </p>
          )}

          {error && (
            <p className="message error-message">
              {error}
            </p>
          )}

        </section>

        {/* All Students */}
        <section className="panel">

          <div className="list-heading">
            <h2>All Students</h2>

            <span className="student-count">
              {filteredStudents.length} of {students.length}
            </span>
          </div>

          {/* Search */}
          <div className="search-box">

            <input
              type="search"
              placeholder="Search by name, roll number, email or course..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search students"
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            )}

          </div>

          {loading ? (
            <p>Loading students...</p>
          ) : filteredStudents.length === 0 ? (
            <p>
              {students.length === 0
                ? "No students added yet."
                : "No students match your search."}
            </p>
          ) : (

            <div className="table-wrap">
              <table>

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>

                      <td>{student.name}</td>
                      <td>{student.rollNumber}</td>
                      <td>{student.email}</td>
                      <td>{student.course}</td>
                      <td>{student.year}</td>

                      <td>
                        <div className="action-buttons">

                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() => handleEdit(student)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleDelete(student)}
                          >
                            Delete
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </main>
    </div>
  );
}

export default App;
