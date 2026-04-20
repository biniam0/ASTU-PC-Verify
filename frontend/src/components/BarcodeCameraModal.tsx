import { useEffect, useRef, useState } from 'react'
import { BrowserCodeReader, BrowserMultiFormatReader } from '@zxing/browser'

type BarcodeCameraModalProps = {
  open: boolean
  onClose: () => void
  /** Raw text from barcode / QR (caller normalizes to student ID) */
  onDecoded: (rawText: string) => void
}

/**
 * Opens the device camera and decodes barcodes / QR codes (ZXing).
 * Requires HTTPS or localhost and camera permission.
 */
export function BarcodeCameraModal({ open, onClose, onDecoded }: BarcodeCameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDecodedRef = useRef(onDecoded)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    onDecodedRef.current = onDecoded
  }, [onDecoded])

  useEffect(() => {
    if (!open) {
      setError(null)
      setStarting(false)
      return
    }

    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let controls: { stop: () => void } | undefined
    let decoded = false

    setError(null)
    setStarting(true)

    const reader = new BrowserMultiFormatReader()

    async function startCamera() {
      try {
        let deviceId: string | undefined
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devices.filter((device) => device.kind === 'videoinput')
          const preferred =
            videoInputs.find((device) => /back|rear|environment/i.test(device.label)) ??
            videoInputs[0]
          deviceId = preferred?.deviceId
        }

        await reader.decodeFromVideoDevice(deviceId, video, (result, _err, ctrl) => {
          if (cancelled || decoded || !result) return
          decoded = true
          const text = result.getText()
          try {
            ctrl.stop()
          } catch {
            /* ignore */
          }
          onDecodedRef.current(text)
        })
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e instanceof Error
              ? e.message
              : 'Could not start camera. Allow camera access and use HTTPS or localhost.'
          setError(msg)
        }
      } finally {
        if (!cancelled) setStarting(false)
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      decoded = true
      try {
        controls?.stop()
      } catch {
        /* ignore */
      }
      BrowserCodeReader.cleanVideoSource(video)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scan-title"
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 id="barcode-scan-title" className="text-lg font-semibold text-gray-900">
              Scan student ID
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Point the camera at a barcode or QR code on the student ID. The app will verify the ID
              and load registered laptop details.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            muted
            playsInline
            aria-label="Camera preview for barcode scanning"
          />
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
              Starting camera…
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Tip: use the back camera on a phone. If the browser blocks the camera, check site
          permissions (secure context: HTTPS or localhost).
        </p>
      </div>
    </div>
  )
}
