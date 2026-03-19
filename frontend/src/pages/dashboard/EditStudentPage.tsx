import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getStudent, updateStudent } from '@/services/studentService'
import type { RegisterStudentPayload, Student } from '@/types/student'

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [
  { value: '', label: 'Select year' },
  ...Array.from({ length: 15 }, (_, i) => currentYear - 10 + i).map((y) => ({
    value: String(y),
    label: String(y),
  })),
]

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Select department' },
  { value: 'cse', label: 'Computer Science and Engineering' },
  { value: 'ece', label: 'Electrical and Computer Engineering' },
  { value: 'mech', label: 'Mechanical Engineering' },
  { value: 'civil', label: 'Civil Engineering' },
  { value: 'other', label: 'Other' },
]

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export function EditStudentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateStudent = (location.state as { student?: Student } | undefined)?.student
  const [form, setForm] = useState<RegisterStudentPayload>({
    fullName: '',
    studentId: '',
    yearOfEntry: '',
    gender: '',
    department: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Missing student id')
      return
    }
    if (stateStudent && stateStudent.id === id) {
      setForm({
        fullName: stateStudent.fullName ?? '',
        studentId: stateStudent.studentId ?? '',
        yearOfEntry: stateStudent.yearOfEntry ?? '',
        gender: stateStudent.gender ?? '',
        department: stateStudent.department ?? '',
      })
      setLoading(false)
      return
    }
    getStudent(id)
      .then((student) => {
        setForm({
          fullName: student.fullName ?? '',
          studentId: student.studentId ?? '',
          yearOfEntry: student.yearOfEntry ?? '',
          gender: student.gender ?? '',
          department: student.department ?? '',
        })
      })
      .catch(() => setError('Failed to load student. Use Manage Students and click Edit.'))
      .finally(() => setLoading(false))
  }, [id, stateStudent?.id])

  function updateField<K extends keyof RegisterStudentPayload>(key: K, value: RegisterStudentPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id) return
    setError(null)
    const { fullName, studentId, yearOfEntry, gender, department } = form
    if (!fullName.trim() || !studentId.trim() || !yearOfEntry || !gender || !department) {
      setError('Please fill in all required fields.')
      return
    }
    setSubmitting(true)
    try {
      await updateStudent(id, {
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        yearOfEntry,
        gender,
        department,
      })
      navigate('/manage-students', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    navigate('/manage-students')
  }

  const inputClass =
    'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading…</div>
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <PersonIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Edit student</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="fullName" className={labelClass}>
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Enter full name"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className={inputClass}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="studentId" className={labelClass}>
            Student ID <span className="text-red-500">*</span>
          </label>
          <input
            id="studentId"
            type="text"
            placeholder="Enter student id"
            value={form.studentId}
            onChange={(e) => updateField('studentId', e.target.value)}
            className={inputClass}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="yearOfEntry" className={labelClass}>
            Year of Entry <span className="text-red-500">*</span>
          </label>
          <select
            id="yearOfEntry"
            value={form.yearOfEntry}
            onChange={(e) => updateField('yearOfEntry', e.target.value)}
            className={inputClass}
            disabled={submitting}
          >
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="gender" className={labelClass}>
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={form.gender}
            onChange={(e) => updateField('gender', e.target.value)}
            className={inputClass}
            disabled={submitting}
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>
            Department <span className="text-red-500">*</span>
          </label>
          <select
            id="department"
            value={form.department}
            onChange={(e) => updateField('department', e.target.value)}
            className={inputClass}
            disabled={submitting}
          >
            {DEPARTMENT_OPTIONS.map((opt) => (
              <option key={opt.value || 'empty'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-blue-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
