import { apiRequest } from './apiService'
import type { RegisterStudentPayload, Student } from '@/types/student'

/** Register a new student. Backend: POST /students */
export async function registerStudent(payload: RegisterStudentPayload): Promise<Student> {
  return apiRequest<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** Fetch all students. Backend: GET /students */
export async function getStudents(): Promise<Student[]> {
  return apiRequest<Student[]>('/students')
}

/** Fetch one student. Backend: GET /students/:id */
export async function getStudent(id: string): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`)
}

/** Update a student. Backend: PUT /students/:id */
export async function updateStudent(id: string, payload: RegisterStudentPayload): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

/** Delete a student. Backend: DELETE /students/:id */
export async function deleteStudent(id: string): Promise<void> {
  const base = import.meta.env.VITE_API_URL ?? '/api'
  const res = await fetch(`${base}/students/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(res.statusText || `Delete failed: ${res.status}`)
}
