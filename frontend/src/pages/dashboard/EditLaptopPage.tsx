import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getLaptop, updateLaptop } from '@/services/laptopService'
import type { Laptop } from '@/types/laptop'

function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export function EditLaptopPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const stateLaptop = (location.state as { laptop?: Laptop } | undefined)?.laptop
  const [form, setForm] = useState({
    brandName: '',
    model: '',
    serialNumber: '',
    studentId: '',
    macAddress: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Missing laptop id')
      return
    }
    if (stateLaptop && stateLaptop.id === id) {
      setForm({
        brandName: stateLaptop.brandName ?? '',
        model: stateLaptop.model ?? '',
        serialNumber: stateLaptop.serialNumber ?? '',
        studentId: stateLaptop.studentId ?? '',
        macAddress: stateLaptop.macAddress ?? '',
      })
      setLoading(false)
      return
    }
    getLaptop(id)
      .then((laptop) => {
        setForm({
          brandName: laptop.brandName ?? '',
          model: laptop.model ?? '',
          serialNumber: laptop.serialNumber ?? '',
          studentId: laptop.studentId ?? '',
          macAddress: laptop.macAddress ?? '',
        })
      })
      .catch(() => setError('Failed to load laptop. Use Manage Laptops and click Edit.'))
      .finally(() => setLoading(false))
  }, [id, stateLaptop?.id])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!id) return
    setError(null)
    const { brandName, model, serialNumber, studentId, macAddress } = form
    if (!brandName.trim() || !model.trim() || !serialNumber.trim()) {
      setError('Brand, Model, and Serial number are required.')
      return
    }
    setSubmitting(true)
    try {
      await updateLaptop(id, {
        brandName: brandName.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        studentId: studentId.trim(),
        macAddress: macAddress.trim() || undefined,
      })
      navigate('/manage-laptops', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500'
  const labelClass = 'mb-1 block text-sm font-medium text-gray-700'

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading…</div>
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center gap-2 bg-teal-500 px-6 py-3">
        <LaptopIcon className="h-6 w-6 shrink-0 text-white" />
        <h2 className="text-lg font-semibold text-white">Edit laptop</h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {error && (
          <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label htmlFor="brandName" className={labelClass}>Brand Name *</label>
          <input
            id="brandName"
            type="text"
            value={form.brandName}
            onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))}
            className={inputClass}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="model" className={labelClass}>Model *</label>
          <input
            id="model"
            type="text"
            value={form.model}
            onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
            className={inputClass}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="serialNumber" className={labelClass}>Serial Number *</label>
          <input
            id="serialNumber"
            type="text"
            value={form.serialNumber}
            onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))}
            className={inputClass}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="studentId" className={labelClass}>Student ID (assigned to)</label>
          <input
            id="studentId"
            type="text"
            placeholder="Leave empty if unassigned"
            value={form.studentId}
            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
            className={inputClass}
            disabled={submitting}
          />
        </div>
        <div>
          <label htmlFor="macAddress" className={labelClass}>Mac address</label>
          <input
            id="macAddress"
            type="text"
            value={form.macAddress}
            onChange={(e) => setForm((p) => ({ ...p, macAddress: e.target.value }))}
            className={inputClass}
            disabled={submitting}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/manage-laptops')}
            disabled={submitting}
            className="rounded border border-gray-300 bg-white px-4 py-2.5 font-medium text-blue-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
