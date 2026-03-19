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

/**
 * Register a new laptop. Sends multipart/form-data for image uploads.
 * Backend: POST /laptops (multipart) or accept JSON with base64 and adapt this.
 */
export async function registerLaptop(payload: RegisterLaptopPayload): Promise<Laptop> {
  const formData = buildFormData(payload)
  const res = await fetch(`${API_BASE}/laptops`, {
    method: 'POST',
    body: formData,
    // Do not set Content-Type; browser sets multipart/form-data with boundary
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `API error: ${res.status}`)
  }
  return res.json()
}
