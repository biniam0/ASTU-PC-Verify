import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStudents, deleteStudent } from '@/services/studentService'
import type { Student } from '@/types/student'

const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    studentId: 'ASTU/2024/001',
    fullName: 'Abebe Kebede',
    department: 'CSE',
    yearOfEntry: '2024',
    gender: 'Male',
    laptopStatus: 'Registered',
  },
]

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function PlusPersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  )
}

function formatYear(yearOfEntry: string): string {
  const y = parseInt(yearOfEntry, 10)
  if (Number.isNaN(y)) return yearOfEntry
  return `${y}/${y + 1}`
}

export function ManageStudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getStudents()
      .then((data) => {
        if (!cancelled) setStudents(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setStudents(MOCK_STUDENTS)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q)
    )
  }, [students, search])

  async function handleDelete(student: Student) {
    if (!window.confirm(`Delete student "${student.fullName}" (${student.studentId})?`)) return
    setDeletingId(student.id)
    try {
      await deleteStudent(student.studentId)
      setStudents((prev) => prev.filter((s) => s.id !== student.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(student: Student) {
    // Edit route uses studentId (encoded) because backend identifies students by student_id
    navigate(`/students/${encodeURIComponent(student.studentId)}/edit`, { state: { student } })
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <PeopleIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Manage Students</h2>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/register-student"
            className="inline-flex w-fit items-center gap-2 rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusPersonIcon className="h-5 w-5" />
            Add new students
          </Link>
          <div className="relative w-full sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="search, edit and manage students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-gray-300 bg-gray-50 py-2.5 pl-10 pr-3 text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="overflow-x-auto rounded border border-gray-200 bg-white">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading…</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Student ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Full name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Gender
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Laptop
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {student.fullName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {student.department}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {formatYear(student.yearOfEntry)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {student.gender}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {student.laptopStatus ?? 'Not Registered'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEdit(student)}
                            className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student.id}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
