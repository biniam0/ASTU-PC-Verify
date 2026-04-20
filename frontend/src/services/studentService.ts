import { apiRequest } from './apiService'
import type { RegisterStudentPayload, Student } from '@/types/student'

interface BackendStudent {
  id: number | string
  student_id: string
  full_name: string
  year_of_entry: number | string | null
  gender?: string | null
  department?: string | null
  laptop_status?: string | null
}

function mapStudent(row: BackendStudent): Student {
  return {
    id: String(row.id),
    studentId: row.student_id,
    fullName: row.full_name,
    yearOfEntry: row.year_of_entry != null ? String(row.year_of_entry) : '',
    gender: row.gender ?? '',
    department: row.department ?? '',
    laptopStatus: row.laptop_status ?? undefined,
  }
}

/** Register a new student. Backend: POST /api/students (auth + admin) */
export async function registerStudent(payload: RegisterStudentPayload): Promise<Student> {
  const res = await apiRequest<{ student: BackendStudent }>('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res?.student) throw new Error('Failed to register student')
  return mapStudent(res.student)
}

/** Fetch students (first page). Backend: GET /api/students -> { data, pagination } */
export async function getStudents(): Promise<Student[]> {
  const res = await apiRequest<{ data: BackendStudent[]; pagination: unknown }>('/students')
  const rows = Array.isArray(res?.data) ? res.data : []
  return rows.map(mapStudent)
}

/** Fetch one student by studentId. Backend: GET /api/students/:studentId */
export async function getStudent(studentId: string): Promise<Student> {
  const res = await apiRequest<{ student: BackendStudent }>(`/students/${encodeURIComponent(studentId)}`)
  if (!res?.student) throw new Error('Student not found')
  return mapStudent(res.student)
}

/** Update a student by studentId. Backend: PUT /api/students/:studentId */
export async function updateStudent(studentId: string, payload: RegisterStudentPayload): Promise<Student> {
  const res = await apiRequest<{ student: BackendStudent }>(`/students/${encodeURIComponent(studentId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
  if (!res?.student) throw new Error('Failed to update student')
  return mapStudent(res.student)
}

/** Soft-delete a student (mark inactive) by studentId. Backend: DELETE /api/students/:studentId */
export async function deleteStudent(studentId: string): Promise<void> {
  await apiRequest<unknown>(`/students/${encodeURIComponent(studentId)}`,
    {
      method: 'DELETE',
    },
  )
}
