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
  frontViewUrl?: string
  backViewUrl?: string
  serialNumberImageUrl?: string
  macAddressScreenUrl?: string
  createdAt?: string
}
