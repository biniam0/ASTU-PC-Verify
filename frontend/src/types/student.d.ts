// Student registration (SRS 3.1.2)
export interface RegisterStudentPayload {
  fullName: string
  studentId: string
  yearOfEntry: string
  gender: string
  department: string
}

export interface Student extends RegisterStudentPayload {
  id: string
  createdAt?: string
}
