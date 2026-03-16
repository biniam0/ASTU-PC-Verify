import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerStudent } from '@/services/studentService'
import type { RegisterStudentPayload } from '@/types/student'

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

// TODO: Replace with API-fetched list when backend is ready
const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Select department' },
  { value: 'cse', label: 'Computer Science and Engineering' },
  { value: 'ece', label: 'Electrical and Computer Engineering' },
  { value: 'mech', label: 'Mechanical Engineering' },
  { value: 'civil', label: 'Civil Engineering' },
  { value: 'other', label: 'Other' },
]

const initialForm: RegisterStudentPayload = {
  fullName: '',
  studentId: '',
  yearOfEntry: '',
  gender: '',
  department: '',
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

export function RegisterStudentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterStudentPayload>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function updateField<K extends keyof RegisterStudentPayload>(key: K, value: RegisterStudentPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const { fullName, studentId, yearOfEntry, gender, department } = form
    if (!fullName.trim() || !studentId.trim() || !yearOfEntry || !gender || !department) {
      setError('Please fill in all required fields.')
      return
    }
    setIsLoading(true)
    try {
      await registerStudent({
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        yearOfEntry,
        gender,
        department,
      })
      setForm(initialForm)
      // TODO: show success toast / message; optional redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setForm(initialForm)
    setError(null)
    navigate(-1)
  }

  const inputClass =
    'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <div>
      {/* Section header - teal bar */}
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <PersonIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Register student</h2>
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
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
            disabled={isLoading}
            className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {isLoading ? 'Registering…' : 'Register'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-blue-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
