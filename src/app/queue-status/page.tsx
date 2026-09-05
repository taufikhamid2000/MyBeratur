"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import PageContainer from "@/components/Layout/PageContainer";
import Header from "@/components/Layout/Header";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import ActionButtons from "@/components/Layout/ActionButtons";
import { departments } from "@/data/departments";
import { states } from "@/data/states";
import { branches } from "@/data/branches";
import { services } from "@/data/services";
import { userCategories } from "@/data/userCategories";
import { useAuth } from "@/lib/AuthContext";

interface QueueTicket {
  queueNumber: string;
  estimatedWaitTime: string;
  estimatedArrivalTime: string;
  priority: boolean;
  timestamp: Date;
  isAfterWorkingHours?: boolean;
  alternativeBranches?: typeof branches;
  ticketData: {
    department: string;
    state: string;
    branch: string;
    service: string;
    category: string;
    queueNumber: string;
    estimatedWaitTime: string;
    estimatedArrivalTime: string;
    timestamp: string;
    checkUrl: string;
    isAfterWorkingHours?: boolean;
    alternativeBranches?: string[];
  };
}

// Helper function to format minutes into user-friendly time format
const formatWaitTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} minit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} jam`;
  }

  return `${hours} jam ${remainingMinutes} minit`;
};

// Helper function to check if time is outside working hours
const isOutsideWorkingHours = (arrivalTime: Date): boolean => {
  const hours = arrivalTime.getHours();
  const minutes = arrivalTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Working hours: 8:00 AM (480 minutes) to 5:00 PM (1020 minutes)
  const workingStartMinutes = 8 * 60; // 8:00 AM
  const workingEndMinutes = 17 * 60; // 5:00 PM

  // Check if arrival time is on the same day
  const currentTime = new Date();
  const isSameDay = arrivalTime.toDateString() === currentTime.toDateString();

  if (isSameDay) {
    // If it's the same day, check if outside 8 AM - 5 PM
    return (
      timeInMinutes < workingStartMinutes || timeInMinutes >= workingEndMinutes
    );
  }

  // If it's the next day (crossed midnight), it's definitely outside hours
  return true;
};

// Helper function to get alternative branches
const getAlternativeBranches = (
  currentBranchId: number,
  departmentId: number,
  stateId: number
) => {
  return branches
    .filter(
      (branch) =>
        branch.id !== currentBranchId &&
        branch.department_id === departmentId &&
        branch.state_id === stateId &&
        branch.status === "Buka"
    )
    .slice(0, 3); // Show top 3 alternatives
};

const QueueStatusContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null
  );
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);
  const [step, setStep] = useState<"confirm" | "ticket" | "complete">(
    "confirm"
  );

  useEffect(() => {
    const departmentId = searchParams.get("department");
    const stateId = searchParams.get("state");
    const branchId = searchParams.get("branch");
    const serviceId = searchParams.get("service");
    const categoryId = searchParams.get("category");

    if (!departmentId || !stateId || !branchId || !serviceId || !categoryId) {
      router.push("/");
      return;
    }

    const deptId = parseInt(departmentId);
    const stateIdNum = parseInt(stateId);
    const branchIdNum = parseInt(branchId);
    const serviceIdNum = parseInt(serviceId);
    const categoryIdNum = parseInt(categoryId);

    const department = departments.find((d) => d.id === deptId);
    const state = states.find((s) => s.id === stateIdNum);
    const branch = branches.find((b) => b.id === branchIdNum);
    const service = services.find((s) => s.id === serviceIdNum);
    const category = userCategories.find((c) => c.id === categoryIdNum);

    if (!department || !state || !branch || !service || !category) {
      router.push("/");
      return;
    }

    setSelectedDepartment(deptId);
    setSelectedState(stateIdNum);
    setSelectedBranch(branchIdNum);
    setSelectedService(serviceIdNum);
    setSelectedCategory(categoryIdNum);
  }, [searchParams, router]);

  const generateQueueNumber = () => {
    if (!user) {
      const returnTo = `/queue-status?department=${selectedDepartment}&state=${selectedState}&branch=${selectedBranch}&service=${selectedService}&category=${selectedCategory}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    const branch = branches.find((b) => b.id === selectedBranch);
    const service = services.find((s) => s.id === selectedService);
    const category = userCategories.find((c) => c.id === selectedCategory);

    if (!branch || !service || !category) return;

    // Generate queue number based on new 8-digit format: {DD}{SS}{BB}{NN}
    const currentQueue = branch.current_queue;
    const newQueueNumber = currentQueue + 1;

    // Format: DD (department) + SS (service) + BB (branch) + NN (queue number)
    const departmentCode =
      selectedDepartment?.toString().padStart(2, "0") || "00";
    const serviceCode = selectedService?.toString().padStart(2, "0") || "00";
    const branchCode = selectedBranch?.toString().padStart(2, "0") || "00";
    const queueCode = newQueueNumber.toString().padStart(2, "0");

    const formattedNumber = `${departmentCode}${serviceCode}${branchCode}${queueCode}`;

    // Calculate estimated wait time (priority users get faster service)
    const baseWaitTime = Math.ceil(branch.total_queue * 5); // 5 minutes per person
    const estimatedMinutes = category.priority
      ? Math.ceil(baseWaitTime * 0.5)
      : baseWaitTime; // Priority users get 50% faster service
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(
      estimatedArrival.getMinutes() + estimatedMinutes
    );

    // Check if arrival time is outside working hours
    const isOutsideHours = isOutsideWorkingHours(estimatedArrival);
    const alternativeBranches = isOutsideHours
      ? getAlternativeBranches(branch.id, branch.department_id, branch.state_id)
      : [];

    const ticket: QueueTicket = {
      queueNumber: formattedNumber,
      estimatedWaitTime: formatWaitTime(estimatedMinutes),
      estimatedArrivalTime: estimatedArrival.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      priority: category.priority,
      timestamp: new Date(),
      isAfterWorkingHours: isOutsideHours,
      alternativeBranches: alternativeBranches,
      ticketData: {
        department: selectedDepartmentData?.full_name || "",
        state: selectedStateData?.name || "",
        branch: branch.name,
        service: service.name,
        category: category.name,
        queueNumber: formattedNumber,
        estimatedWaitTime: formatWaitTime(estimatedMinutes),
        estimatedArrivalTime: estimatedArrival.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        timestamp: new Date().toISOString(),
        checkUrl: `${window.location.origin}/queue-status?department=${selectedDepartment}&state=${selectedState}&branch=${selectedBranch}&service=${selectedService}&category=${selectedCategory}`,
        isAfterWorkingHours: isOutsideHours,
        alternativeBranches: alternativeBranches.map((b) => b.name),
      },
    };

    setQueueTicket(ticket);
    setStep("ticket");
  };

  const handleCancel = () => {
    if (confirm("Adakah anda pasti mahu membatalkan nombor giliran ini?")) {
      router.push("/");
    }
  };

  const handleBack = () => {
    router.push(
      `/branch-selection?department=${selectedDepartment}&state=${selectedState}`
    );
  };

  const downloadTicket = () => {
    if (!queueTicket) return;

    // Create PDF
    const pdf = new jsPDF();

    // Add header
    pdf.setFontSize(20);
    pdf.setTextColor(34, 139, 34); // Green color
    pdf.text("Nombor Giliran", 105, 20, { align: "center" });

    // Add queue number
    pdf.setFontSize(32);
    pdf.setTextColor(0, 0, 0);
    pdf.text(queueTicket.queueNumber, 105, 40, { align: "center" });

    // Add priority badge if applicable
    if (queueTicket.priority) {
      pdf.setFontSize(12);
      pdf.setTextColor(255, 140, 0); // Orange color
      pdf.text("⭐ Giliran Khas - Keutamaan", 105, 55, { align: "center" });
    }

    // Add ticket details
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    let yPosition = 80;
    const lineHeight = 8;

    pdf.text(`Jabatan: ${queueTicket.ticketData.department}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Negeri: ${queueTicket.ticketData.state}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Lokasi: ${queueTicket.ticketData.branch}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Servis: ${queueTicket.ticketData.service}`, 20, yPosition);
    yPosition += lineHeight;
    pdf.text(`Kategori: ${queueTicket.ticketData.category}`, 20, yPosition);
    yPosition += lineHeight * 2;

    pdf.text(
      `Masa Ambil Nombor: ${new Date(
        queueTicket.ticketData.timestamp
      ).toLocaleString("ms-MY")}`,
      20,
      yPosition
    );
    yPosition += lineHeight * 2;
    pdf.text(
      `Anggaran Masa Tiba: ${queueTicket.ticketData.estimatedArrivalTime}`,
      20,
      yPosition
    );
    yPosition += lineHeight;
    pdf.text(
      `Anggaran Masa Menunggu: ${queueTicket.ticketData.estimatedWaitTime}`,
      20,
      yPosition
    );
    yPosition += lineHeight;

    // Add warning if after working hours
    if (queueTicket.isAfterWorkingHours) {
      yPosition += lineHeight;
      pdf.setFontSize(10);
      pdf.setTextColor(220, 38, 38); // Red color
      pdf.text("⚠️ AMARAN: Masa Tiba Selepas Waktu Operasi", 20, yPosition);
      yPosition += lineHeight;
      pdf.setFontSize(8);
      pdf.text(
        "Anggaran masa tiba melebihi waktu operasi (5:00 petang)",
        20,
        yPosition
      );
      yPosition += lineHeight;
      pdf.text(
        "Cadangan: Batal nombor dan cuba lagi esok atau pilih lokasi lain",
        20,
        yPosition
      );
      yPosition += lineHeight;
    }

    // Add QR code instructions
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Imbas QR code untuk semak status giliran", 20, yPosition);
    yPosition += lineHeight;
    pdf.text("atau lawati:", 20, yPosition);
    yPosition += lineHeight;
    pdf.text(queueTicket.ticketData.checkUrl, 20, yPosition);
    yPosition += lineHeight;
    pdf.text("Format nombor: DDSSBBNN (8 digit)", 20, yPosition);

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Dicetak pada: " + new Date().toLocaleString("ms-MY"), 20, 280);

    // Save PDF
    pdf.save(`queue-ticket-${queueTicket.queueNumber}.pdf`);
  };

  const qrCodeRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;

    // Convert QR code to canvas and download
    const canvas = qrCodeRef.current.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-ticket-${queueTicket?.queueNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (
    !selectedDepartment ||
    !selectedState ||
    !selectedBranch ||
    !selectedService ||
    !selectedCategory
  )
    return null;

  const selectedDepartmentData = departments.find(
    (d) => d.id === selectedDepartment
  );
  const selectedStateData = states.find((s) => s.id === selectedState);
  const selectedBranchData = branches.find((b) => b.id === selectedBranch);
  const selectedServiceData = services.find((s) => s.id === selectedService);
  const selectedCategoryData = userCategories.find(
    (c) => c.id === selectedCategory
  );

  const breadcrumbItems = [
    { label: "Home", onClick: () => router.push("/") },
    {
      label: "Pilih Negeri",
      onClick: () =>
        router.push(`/state-selection?department=${selectedDepartment}`),
    },
    {
      label: "Pilih Lokasi",
      onClick: () =>
        router.push(
          `/branch-selection?department=${selectedDepartment}&state=${selectedState}`
        ),
    },
    {
      label: "Pilih Servis",
      onClick: () =>
        router.push(
          `/service-selection?department=${selectedDepartment}&state=${selectedState}&branch=${selectedBranch}`
        ),
    },
    {
      label: "Pilih Kategori",
      onClick: () =>
        router.push(
          `/user-category?department=${selectedDepartment}&state=${selectedState}&branch=${selectedBranch}&service=${selectedService}`
        ),
    },
    { label: "Ambil Nombor" },
  ];

  return (
    <PageContainer>
      <Breadcrumb items={breadcrumbItems} />

      <Header
        title="Ambil Nombor Giliran"
        subtitle="Sahkan maklumat dan ambil nombor giliran anda"
      />

      <div className="px-8 py-6">
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Jabatan:</strong> {selectedDepartmentData?.full_name}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Negeri:</strong> {selectedStateData?.name}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Lokasi:</strong> {selectedBranchData?.name}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Servis:</strong> {selectedServiceData?.name}
          </p>
          <p className="text-sm text-blue-800">
            <strong>Kategori:</strong> {selectedCategoryData?.icon}{" "}
            {selectedCategoryData?.name}
          </p>
        </div>

        {step === "confirm" && (
          <div className="text-center">
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Maklumat Giliran
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Lokasi:</strong> {selectedBranchData?.name}
                </p>
                <p>
                  <strong>Alamat:</strong> {selectedBranchData?.address}
                </p>
                <p>
                  <strong>Waktu Operasi:</strong>{" "}
                  {selectedBranchData?.operating_hours}
                </p>
                <p>
                  <strong>Nombor Telefon:</strong> {selectedBranchData?.phone}
                </p>
                <p>
                  <strong>Giliran Semasa:</strong>{" "}
                  {selectedBranchData?.current_queue}
                </p>
                <p>
                  <strong>Jumlah dalam Giliran:</strong>{" "}
                  {selectedBranchData?.total_queue}
                </p>
                <p>
                  <strong>Anggaran Masa Tunggu:</strong>{" "}
                  {selectedBranchData?.estimated_wait_time}
                </p>
              </div>
            </div>

            {/* Warning for after working hours */}
            {(() => {
              const baseWaitTime = Math.ceil(
                (selectedBranchData?.total_queue || 0) * 5
              );
              const estimatedMinutes = selectedCategoryData?.priority
                ? Math.ceil(baseWaitTime * 0.5)
                : baseWaitTime;
              const estimatedArrival = new Date();
              estimatedArrival.setMinutes(
                estimatedArrival.getMinutes() + estimatedMinutes
              );

              if (isOutsideWorkingHours(estimatedArrival)) {
                return (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-red-800 mb-2">
                          ⚠️ Masa Tiba Selepas Waktu Operasi
                        </h4>
                        <p className="text-sm text-red-700 mb-3">
                          Anggaran masa tiba anda adalah{" "}
                          <strong>
                            {estimatedArrival.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </strong>
                          , yang melebihi waktu operasi (5:00 petang).
                        </p>
                        <p className="text-sm text-red-700">
                          <strong>Cadangan:</strong> Cuba lagi esok atau pilih
                          lokasi lain.
                        </p>
                        <button
                          onClick={handleBack}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Pilih Lokasi Lain
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex justify-center space-x-4">
              <button
                onClick={generateQueueNumber}
                disabled={authLoading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {user ? "Ambil Nombor Giliran" : "Log Masuk untuk Ambil Nombor"}
              </button>
            </div>
            {!user && !authLoading && (
              <p className="mt-3 text-xs text-gray-500">
                Anda perlu log masuk untuk mengambil nombor giliran.
              </p>
            )}
          </div>
        )}

        {step === "ticket" && queueTicket && (
          <div className="text-center">
            <div className="mb-6 p-8 bg-white rounded-lg border-2 border-green-200 shadow-lg">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  Nombor Giliran Anda
                </h3>
                <div className="text-4xl font-bold text-gray-900 mb-4">
                  {queueTicket.queueNumber}
                </div>
                {queueTicket.priority && (
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {selectedCategoryData?.icon} Giliran Khas - Keutamaan
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Masa Ambil Nombor:</strong>{" "}
                  {queueTicket.timestamp.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
                <h2>
                  <strong>
                    Anggaran Masa Tiba: {queueTicket.estimatedArrivalTime}
                  </strong>
                </h2>
                <p>
                  <strong>Anggaran Masa Menunggu:</strong>{" "}
                  {queueTicket.estimatedWaitTime}
                </p>
              </div>

              {/* Warning for after working hours */}
              {queueTicket.isAfterWorkingHours && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        ⚠️ Masa Tiba Selepas Waktu Operasi
                      </h4>
                      <p className="text-sm text-red-700 mb-3">
                        Anggaran masa tiba anda adalah{" "}
                        <strong>{queueTicket.estimatedArrivalTime}</strong>,
                        yang melebihi waktu operasi (5:00 petang).
                        <br />
                        <strong>Cadangan:</strong>
                      </p>
                      <ul className="text-sm text-red-700 space-y-1 mb-3">
                        <li>• Batal nombor giliran ini dan cuba lagi esok</li>
                        <li>• Periksa lokasi lain yang mungkin kurang sesak</li>
                        {queueTicket.alternativeBranches &&
                          queueTicket.alternativeBranches.length > 0 && (
                            <li>
                              • Lokasi alternatif:{" "}
                              {queueTicket.alternativeBranches
                                .map((b) => b.name)
                                .join(", ")}
                            </li>
                          )}
                      </ul>
                      <div className="flex-1 space-x-2">
                        <button
                          onClick={handleBack}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          Pilih Lokasi Lain
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  📱 Simpan nombor giliran Anda
                </h4>
                <div className="flex flex-col items-center space-y-4">
                  <div
                    ref={qrCodeRef}
                    className="p-4 bg-white rounded-lg border"
                  >
                    <QRCodeCanvas
                      value={JSON.stringify({
                        ...queueTicket.ticketData,
                        checkUrl: `${window.location.origin}/queue-status?department=${selectedDepartment}&state=${selectedState}&branch=${selectedBranch}&service=${selectedService}&category=${selectedCategory}`,
                      })}
                      size={120}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={downloadQRCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📱 Muat Turun Kod QR
                    </button>
                    <button
                      onClick={downloadTicket}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      📄 Muat Turun PDF
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/direct-queue?queueNumber=${queueTicket.queueNumber}`
                      )
                    }
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    🚀 Giliran Secara Langsung
                  </button>
                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    Imbas Kod QR atau muat turun PDF untuk simpan maklumat
                    giliran anda
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Peringatan:</strong> Sila datang ke lokasi 10 minit
                sebelum nombor anda dipanggil.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleCancel}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Batalkan Nombor
              </button>
            </div>
          </div>
        )}
      </div>

      <ActionButtons onBack={handleBack} backText="Kembali" />
    </PageContainer>
  );
};

const QueueStatusPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QueueStatusContent />
    </Suspense>
  );
};

export default QueueStatusPage;
