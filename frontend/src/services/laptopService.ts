const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

import type { Laptop, RegisterLaptopPayload } from '@/types/laptop'

function buildFormData(payload: RegisterLaptopPayload): FormData {
  const form = new FormData()
  form.append('studentId', payload.studentId)
  form.append('brandName', payload.brandName)
  form.append('model', payload.model)
  form.append('serialNumber', payload.serialNumber)
  if (payload.macAddress) form.append('macAddress', payload.macAddress)
  if (payload.frontView) form.append('frontView', payload.frontView)
  if (payload.backView) form.append('backView', payload.backView)
  if (payload.serialNumberImage) form.append('serialNumberImage', payload.serialNumberImage)
  if (payload.macAddressScreen) form.append('macAddressScreen', payload.macAddressScreen)
  return form
}

/** Register a new laptop. Backend: POST /laptops (multipart). */
export async function registerLaptop(payload: RegisterLaptopPayload): Promise<Laptop> {
  const formData = buildFormData(payload)
  const res = await fetch(`${API_BASE}/laptops`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error: ${res.status}`)
  }
  return res.json()
}

/** Fetch all laptops. Backend: GET /laptops */
export async function getLaptops(): Promise<Laptop[]> {
  const res = await fetch(`${API_BASE}/laptops`)
  if (!res.ok) throw new Error(res.statusText || `API error: ${res.status}`)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

/** Fetch one laptop. Backend: GET /laptops/:id */
export async function getLaptop(id: string): Promise<Laptop> {
  const res = await fetch(`${API_BASE}/laptops/${id}`)
  if (!res.ok) throw new Error(res.statusText || `API error: ${res.status}`)
  return res.json()
}

/** Update a laptop (text fields only). Backend: PUT /laptops/:id */
export async function updateLaptop(
  id: string,
  payload: Pick<RegisterLaptopPayload, 'studentId' | 'brandName' | 'model' | 'serialNumber' | 'macAddress'>
): Promise<Laptop> {
  const res = await fetch(`${API_BASE}/laptops/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(res.statusText || `API error: ${res.status}`)
  return res.json()
}

/** Delete a laptop. Backend: DELETE /laptops/:id */
export async function deleteLaptop(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/laptops/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(res.statusText || `Delete failed: ${res.status}`)
}
