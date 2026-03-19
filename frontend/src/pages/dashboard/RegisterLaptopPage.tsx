import { useState, useRef, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerLaptop } from '@/services/laptopService'
import type { RegisterLaptopPayload } from '@/types/laptop'

const initialForm: RegisterLaptopPayload = {
  studentId: '',
  brandName: '',
  model: '',
  serialNumber: '',
  macAddress: '',
}

function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

type ImageField = 'frontView' | 'backView' | 'serialNumberImage' | 'macAddressScreen'

export function RegisterLaptopPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterLaptopPayload>({ ...initialForm })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRefs = useRef<Record<ImageField, HTMLInputElement | null>>({
    frontView: null,
    backView: null,
    serialNumberImage: null,
    macAddressScreen: null,
  })

  function updateField<K extends keyof RegisterLaptopPayload>(key: K, value: RegisterLaptopPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  function handleFileChange(field: ImageField, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) updateField(field, file)
    setError(null)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const { studentId, brandName, model, serialNumber, frontView, backView, serialNumberImage } = form
    if (!studentId.trim() || !brandName.trim() || !model.trim() || !serialNumber.trim()) {
      setError('Please fill in all required fields (Student ID, Brand Name, Model, Serial number).')
      return
    }
    if (!frontView || !backView || !serialNumberImage) {
      setError('Please upload required images: Front view, Back view, and Serial number.')
      return
    }
    setIsLoading(true)
    try {
      await registerLaptop(form)
      setForm({ ...initialForm })
      // TODO: success toast / redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setForm({ ...initialForm })
    setError(null)
    navigate(-1)
  }

  const inputClass =
    'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  function UploadBox({
    field,
    label,
    required,
  }: {
    field: ImageField
    label: string
    required?: boolean
  }) {
    const file = form[field]
    return (
      <div>
        <label className={labelClass}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={(el) => {
            fileInputRefs.current[field] = el
          }}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(field, e)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRefs.current[field]?.click()}
          disabled={isLoading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded border border-gray-300 bg-gray-50 py-8 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
        >
          <UploadIcon className="h-8 w-8 text-gray-500" />
          <span className="text-sm text-gray-600">
            {file ? file.name : 'Click to upload'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Section header - teal bar */}
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <LaptopIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Register laptop</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="brandName" className={labelClass}>
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              id="brandName"
              type="text"
              placeholder="e.g hp,mac"
              value={form.brandName}
              onChange={(e) => updateField('brandName', e.target.value)}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="model" className={labelClass}>
              Model <span className="text-red-500">*</span>
            </label>
            <input
              id="model"
              type="text"
              placeholder="e.g latitude 5520"
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="serialNumber" className={labelClass}>
            Serial number <span className="text-red-500">*</span>
          </label>
          <input
            id="serialNumber"
            type="text"
            placeholder="Enter serial number"
            value={form.serialNumber}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="macAddress" className={labelClass}>
            Mac address
          </label>
          <input
            id="macAddress"
            type="text"
            placeholder="e.g 00:01A:02B"
            value={form.macAddress ?? ''}
            onChange={(e) => updateField('macAddress', e.target.value)}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        {/* Laptop images - 2x2 grid */}
        <div>
          <p className={labelClass}>Laptop images</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UploadBox field="frontView" label="Front view" required />
            <UploadBox field="backView" label="Back view" required />
            <UploadBox field="serialNumberImage" label="serial number" required />
            <UploadBox field="macAddressScreen" label="Mac address screen" />
          </div>
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
