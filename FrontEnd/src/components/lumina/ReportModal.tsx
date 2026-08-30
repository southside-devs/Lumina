import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { api, type CreateFIRResult } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { notifyFIRCreated } = useFIREvents();
  const [complainantName, setComplainantName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [dateOfOccurrence, setDateOfOccurrence] = useState("");
  const [timeOfOccurrence, setTimeOfOccurrence] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [suspectDetails, setSuspectDetails] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdFIR, setCreatedFIR] = useState<CreateFIRResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const incidentTypes = [
    "Theft / Burglary",
    "Assault / Violence",
    "Vandalism / Property Damage",
    "Cyber Threat / Breach",
    "Suspicious Activity",
    "Other",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complainantName.trim()) {
      toast.error("Complainant Name is required");
      return;
    }
    if (!contactInfo.trim()) {
      toast.error("Contact Info is required");
      return;
    }
    if (!incidentType) {
      toast.error("Incident Type is required");
      return;
    }
    if (!dateOfOccurrence) {
      toast.error("Date of Occurrence is required");
      return;
    }
    if (!location.trim()) {
      toast.error("Precise Location is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Detailed Description is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api.createFir({
        complainant_name: complainantName,
        contact_info: contactInfo,
        incident_type: incidentType,
        date_of_occurrence: dateOfOccurrence,
        time_of_occurrence: timeOfOccurrence,
        location: location,
        description: description,
        suspect_details: suspectDetails,
      });

      setCreatedFIR(result);
      setIsSubmitting(false);
      setIsSubmitted(true);
      notifyFIRCreated(); // broadcast to Overview, FIR Explorer, etc.
      toast.success(`FIR ${result.FIR_Number} filed successfully!`);
    } catch (err) {
      console.error("Failed to create FIR:", err);
      setIsSubmitting(false);
      toast.error("Failed to submit report. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-hairline bg-[#0a0a0b] text-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline p-5">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">
              File First Information Report
            </h2>
            <p className="text-xs text-muted-foreground">LUMINA Command Center</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg border border-hairline text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-signal-ok/20 text-signal-ok">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="font-display text-xl font-bold">Report Submitted</h3>
            <p className="text-sm text-muted-foreground">
              Incident has been logged in the LUMINA Command Center database.
            </p>
            {createdFIR && (
              <div className="w-full rounded-xl border border-hairline bg-[#121214] p-4 text-left space-y-2">
                <p className="text-[10px] font-mono font-bold uppercase text-signal-brand">FIR Reference Details</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
                  <span className="text-muted-foreground">FIR Number:</span>
                  <span className="font-bold text-white">{createdFIR.FIR_Number}</span>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-amber-400 font-semibold">{createdFIR.Status}</span>
                  <span className="text-muted-foreground">Crime Category:</span>
                  <span className="text-white">{createdFIR.Crime_Group}</span>
                  <span className="text-muted-foreground">Date Filed:</span>
                  <span className="text-white">{createdFIR.Date || new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setComplainantName("");
                setContactInfo("");
                setIncidentType("");
                setDateOfOccurrence("");
                setTimeOfOccurrence("");
                setLocation("");
                setDescription("");
                setSuspectDetails("");
                setAttachedFiles([]);
                setIsSubmitted(false);
                setCreatedFIR(null);
                onClose();
              }}
              className="mt-2 rounded-full border border-hairline px-6 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
            {/* Complainant Name & Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                  Complainant Name <span className="text-signal-critical">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={complainantName}
                  onChange={(e) => setComplainantName(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-[#121214] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                  Contact Info <span className="text-signal-critical">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Phone or Email"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-[#121214] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Incident Type */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                Incident Type <span className="text-signal-critical">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex w-full items-center justify-between rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-neutral-100 transition-colors"
              >
                <span>{incidentType || "Select incident type..."}</span>
                <span className="material-symbols-outlined text-black">keyboard_arrow_down</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-hairline bg-[#18181b] p-1.5 shadow-xl">
                  {incidentTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setIncidentType(type);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-[#27272a] transition-colors"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                  Date of Occurrence <span className="text-signal-critical">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 text-lg">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    value={dateOfOccurrence}
                    onChange={(e) => setDateOfOccurrence(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-[#121214] py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                  Time (Approximate)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 text-lg">
                    schedule
                  </span>
                  <input
                    type="time"
                    value={timeOfOccurrence}
                    onChange={(e) => setTimeOfOccurrence(e.target.value)}
                    className="w-full rounded-xl border border-hairline bg-[#121214] py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Precise Location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                Precise Location <span className="text-signal-critical">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/75 text-lg">
                  location_on
                </span>
                <input
                  type="text"
                  placeholder="Street address, landmarks, or coordinates"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-[#121214] py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                Detailed Description <span className="text-signal-critical">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Provide factual details of the event in chronological order..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-[#121214] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Suspect Details */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                Suspect Details (If Known)
              </label>
              <textarea
                rows={2}
                placeholder="Physical traits, clothing, associated vehicles..."
                value={suspectDetails}
                onChange={(e) => setSuspectDetails(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-[#121214] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Evidence & Attachments */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-signal-brand uppercase">
                Evidence & Attachments
              </label>
              <div
                onClick={handleDropzoneClick}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-[#121214] py-5 px-4 text-center hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="material-symbols-outlined text-lg">note_add</span>
                  <span>
                    {attachedFiles.length > 0
                      ? `${attachedFiles.length} file(s) selected`
                      : "Click to upload photos, videos, or documents"}
                  </span>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 text-[10px] text-muted-foreground/60">
                    {attachedFiles.map((f) => f.name).join(", ")}
                  </div>
                )}
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-hairline px-5 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-neutral-100 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
