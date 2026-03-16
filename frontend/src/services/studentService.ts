import { apiRequest } from './apiService'
import type { RegisterStudentPayload, Student } from '@/types/student'

/** Register a new student. Ready for backend: POST /students (or /api/students). */
export async function registerStudent(payload: RegisterStudentPayload): Promise<Student> {
  return apiRequest<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
