import { useNavigate } from "react-router-dom";
import { ShieldAlert, X, Send } from "lucide-react";
import { useAccessStore } from "../../pages/AccessRequests/AccessZustand";
import { useToastStore } from "./toast";
import { CAPABILITY_LABEL } from "../../lib/permissions";

/**
 * Global "insufficient rights" modal. Any capability-403 (surfaced via
 * gateFromError) opens it; the member can send a one-click request for temporary
 * permission, which lands in the Requests page as pending for an admin to review.
 */
export default function AccessGate() {
  const gate = useAccessStore((s) => s.gate);
  const closeGate = useAccessStore((s) => s.closeGate);
  const createRequest = useAccessStore((s) => s.createRequest);
  const push = useToastStore((s) => s.push);
  const navigate = useNavigate();

  if (!gate) return null;

  const label = CAPABILITY_LABEL[gate.capability] ?? gate.capability;

  const onRequest = async () => {
    const ok = await createRequest(gate.slug, {
      capability: gate.capability,
      project_id: gate.projectId,
      target_label: gate.targetLabel,
    });
    closeGate();
    if (ok) {
      push("Request sent — an admin will review it");
      navigate(`/w/${gate.slug}/requests`);
    } else {
      push("Couldn't send the request (you may already have one pending)");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4" onClick={closeGate}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <ShieldAlert size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">You don't have permission</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Your role can't <b>{label.toLowerCase()}</b>
              {gate.targetLabel ? ` (${gate.targetLabel})` : ""}. You can ask an admin for temporary access.
            </p>
          </div>
          <button onClick={closeGate} className="rounded p-1 text-gray-300 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={closeGate} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
          <button onClick={onRequest} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Send size={15} /> Request temporary permission
          </button>
        </div>
      </div>
    </div>
  );
}
