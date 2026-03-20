// Laptop registration (SRS 3.1.3)
export interface RegisterLaptopPayload {
  studentId: string
  brandName: string
  model: string
  serialNumber: string
  macAddress?: string
  frontView?: File
  backView?: File
  serialNumberImage?: File
  macAddressScreen?: File
}

export interface Laptop extends Omit<RegisterLaptopPayload, 'frontView' | 'backView' | 'serialNumberImage' | 'macAddressScreen'> {
  id: string
  /** Display id for list (e.g. LPT/001) */
  laptopId?: string
  /** List/table: "Available" | "Assigned" */
  status?: 'Available' | 'Assigned'
  /** List/table: student name when assigned */
  assignedTo?: string
  frontViewUrl?: string
  backViewUrl?: string
  serialNumberImageUrl?: string
  macAddressScreenUrl?: string
  createdAt?: string
}
