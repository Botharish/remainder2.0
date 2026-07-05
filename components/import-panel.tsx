"use client";

import { Download, FileUp, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { importRemindersFromCsv, toCsv, type ImportResult, type Reminder } from "@/lib/reminders";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ImportPanel({
  onImport,
}: {
  onImport: (reminders: Reminder[], result: ImportResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");

  async function importFile(file: File) {
    setFileName(file.name);

    if (file.size > MAX_FILE_SIZE) {
      setResult({
        clientsCreated: 0,
        projectsCreated: 0,
        remindersCreated: 0,
        skippedRows: 0,
        errors: ["CSV size must be 10MB or less."],
      });
      return;
    }

    const text = await file.text();
    const parsed = importRemindersFromCsv(text);
    setResult(parsed.result);
    onImport(parsed.reminders, parsed.result);
  }

  function downloadTemplate() {
    const blob = new Blob(
      [
        toCsv([
          {
            id: "template-1",
            clientName: "ABC Company",
            projectName: "Website",
            status: "Waiting",
            reminderDate: "2026-07-10",
            reminderTime: "10:00",
            notes: "Call Client",
            completed: false,
          },
        ]),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reminder-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="view-panel">
      <div className="topbar">
        <div>
          <p className="eyebrow">CSV Upload</p>
          <h1>Import your reminders</h1>
          <p className="page-copy">Upload client, project, status, date, time, and notes rows.</p>
        </div>
        <button className="button" onClick={downloadTemplate} type="button">
          <Download size={16} aria-hidden />
          Template
        </button>
      </div>

      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const [file] = Array.from(event.dataTransfer.files);
          if (file) {
            void importFile(file);
          }
        }}
      >
        <div>
          <FileUp size={38} aria-hidden />
          <p className="drop-title">Drag and drop CSV here</p>
          <p className="drop-copy">or choose a file. CSV size: Max 10MB</p>
          <input
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const [file] = Array.from(event.target.files ?? []);
              if (file) {
                void importFile(file);
              }
            }}
            ref={inputRef}
            type="file"
          />
          <button className="button primary" onClick={() => inputRef.current?.click()} type="button">
            <Upload size={16} aria-hidden />
            Choose File
          </button>
        </div>
      </div>

      {result ? (
        <>
          <h2 style={{ marginTop: 18 }}>Imported Successfully</h2>
          {fileName ? <p className="page-copy">{fileName}</p> : null}
          <div className="result-grid">
            <Result label="Clients Created" value={result.clientsCreated} />
            <Result label="Projects Created" value={result.projectsCreated} />
            <Result label="Reminders Created" value={result.remindersCreated} />
            <Result label="Skipped Rows" value={result.skippedRows} />
          </div>
          {result.errors.length > 0 ? (
            <p className="page-copy" style={{ marginTop: 12 }}>
              {result.errors.slice(0, 3).join(" ")}
            </p>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function Result({ label, value }: { label: string; value: number }) {
  return (
    <div className="result-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
