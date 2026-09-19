import { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmActionDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl bg-base-100 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-warning/15 p-3 text-warning"><AlertTriangle size={20} /></div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-base-content/60">{description}</p>
          </div>
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm btn-circle"><X size={17} /></button>
        </div>
        {children}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="btn btn-ghost">{`Cancel`}</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="btn btn-primary">
            {busy ? <span className="loading loading-spinner loading-sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
