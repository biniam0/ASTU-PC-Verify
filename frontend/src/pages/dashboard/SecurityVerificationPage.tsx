import type { SVGProps } from "react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { BarcodeCameraModal } from "@/components/BarcodeCameraModal";
import {
  getVerificationStats,
  verifyByStudentId,
} from "@/services/verificationService";
import { normalizeScannedId } from "@/utils/normalizeScannedId";
import type {
  VerificationResult,
  VerificationStats,
} from "@/types/verification";

// Must match STUDENT_ID_REGEX in backend .env
const STUDENT_ID_REGEX = /^(Ugr|MSc|PhD)\/[0-9]{5}\/[0-9]{2}$/;

const MOCK_STATS: VerificationStats = {
  totalScan: 100,
  verified: 67,
  alerts: 33,
};

const INSTRUCTIONS = [
  "Use Scan ID to open the camera and read a barcode/QR on the student ID, or type the ID and tap Verify",
  "Review the displayed laptop information",
  "Physically verify the laptop matches the registered details",
  "Check serial number and physical appearance",
  "Allow or deny exit based on verification results",
];

function SvgPath(props: SVGProps<SVGPathElement>) {
  return <path {...props} />;
}

function ShieldLockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <SvgPath
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <SvgPath
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9V6a3 3 0 013-3h3M21 9V6a3 3 0 00-3-3h-3M9 21H6a3 3 0 01-3-3v-3M15 21h3a3 3 0 003-3v-3"
      />
    </svg>
  );
}

export function SecurityVerificationPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const studentIdInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<VerificationStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVerificationStats()
      .then((statsData) => {
        if (!cancelled) {
          setStats(statsData ?? MOCK_STATS);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(MOCK_STATS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const verifyWithId = useCallback(async (id: string) => {
    const trimmed = id.trim();
    setScanError(null);
    setResult(null);
    if (!trimmed) {
      setScanError("Enter a student ID.");
      return;
    }
    if (!STUDENT_ID_REGEX.test(trimmed)) {
      setScanError(
        "Student ID must be in the format Ugr/12345/16, MSc/12345/16, or PhD/12345/16.",
      );
      return;
    }
    setScanning(true);
    try {
      const data = await verifyByStudentId(trimmed);
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        studentId: trimmed,
        message:
          err instanceof Error
            ? err.message
            : "Verification failed. Student may not be registered or has no laptop.",
      });
    } finally {
      setScanning(false);
    }
  }, []);

  const handleCameraDecoded = useCallback(
    (raw: string) => {
      const id = normalizeScannedId(raw);
      if (!id) {
        setScanError("Could not read a student ID from the scanned code.");
        setCameraOpen(false);
        return;
      }
      setStudentId(id);
      setCameraOpen(false);
      void verifyWithId(id);
    },
    [verifyWithId],
  );

  function handleScan(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void verifyWithId(studentId.trim());
  }

  return (
    <div>
      <div className="-mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 bg-teal-500 px-6 py-3">
        <div className="flex items-center gap-2">
          <ShieldLockIcon className="h-6 w-6 shrink-0 text-white" />
          <h2 className="text-lg font-semibold text-white">
            Security Verification
          </h2>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-900">
              {loading ? "–" : stats.totalScan}
            </p>
            <p className="text-sm text-gray-500">Total scan</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-green-600">
              {loading ? "–" : stats.verified}
            </p>
            <p className="text-sm text-gray-500">Verified</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-red-600">
              {loading ? "–" : stats.alerts}
            </p>
            <p className="text-sm text-gray-500">Alerts</p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">Scan Student ID</h3>
          <p className="mt-1 text-sm text-gray-600">
            Enter or scan the student ID to verify laptop ownership
          </p>
          <form
            ref={formRef}
            onSubmit={handleScan}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="min-w-0 flex-1">
              <label
                htmlFor="scan-student-id"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Student ID
              </label>
              <input
                ref={studentIdInputRef}
                id="scan-student-id"
                type="text"
                placeholder="e.g. Ugr/12345/16"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                aria-label="Student ID for verification"
                className="w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2.5 text-gray-900 placeholder-gray-500 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
                disabled={scanning}
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              disabled={scanning}
              onClick={() => setCameraOpen(true)}
              className="rounded-full border border-blue-600 bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Open camera to scan student ID barcode or QR code"
            >
              Scan ID
            </button>
            <button
              type="submit"
              disabled={scanning}
              className="rounded-full border border-gray-300 bg-gray-700 px-5 py-2.5 font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {scanning ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              disabled={scanning}
              title="Focus field for barcode scanner, or verify if ID is already entered"
              aria-label={
                studentId.trim()
                  ? "Verify entered student ID"
                  : "Focus student ID field for scanning"
              }
              onClick={() => {
                if (scanning) return;
                const id = studentId.trim();
                if (!id) {
                  studentIdInputRef.current?.focus();
                  studentIdInputRef.current?.select();
                  return;
                }
                formRef.current?.requestSubmit();
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ScanIcon className="h-5 w-5 shrink-0" aria-hidden />
            </button>
          </form>
          {scanError && (
            <p className="mt-2 text-sm text-red-600">{scanError}</p>
          )}
          {result && (
            <div
              className={`mt-4 rounded-lg border p-4 ${
                result.success
                  ? "border-green-200 bg-green-50 text-green-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {result.success ? (
                <div className="space-y-2">
                  <p className="font-semibold">
                    Verified — Student has registered laptop
                  </p>
                  <dl className="grid gap-1 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-600">Student</dt>
                      <dd>{result.studentName ?? result.studentId}</dd>
                    </div>
                    {result.department && (
                      <div>
                        <dt className="text-gray-600">Department</dt>
                        <dd>{result.department}</dd>
                      </div>
                    )}
                    {result.laptop && (
                      <>
                        <div>
                          <dt className="text-gray-600">Laptop</dt>
                          <dd>
                            {result.laptop.brandName} {result.laptop.model}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Serial</dt>
                          <dd>{result.laptop.serialNumber}</dd>
                        </div>
                      </>
                    )}
                    {result.laptop?.imageUrl && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Registered laptop image
                        </p>
                        <div className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white">
                          <img
                            src={result.laptop.imageUrl}
                            alt="Registered laptop for this student"
                            className="h-48 w-full object-contain bg-gray-50"
                          />
                        </div>
                      </div>
                    )}
                  </dl>
                </div>
              ) : (
                <p className="font-semibold">
                  Alert —{" "}
                  {result.message ??
                    "No registered laptop found for this student ID."}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900">
            Verification Instructions:
          </h3>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-gray-700">
            {INSTRUCTIONS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <BarcodeCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDecoded={handleCameraDecoded}
      />
    </div>
  );
}
