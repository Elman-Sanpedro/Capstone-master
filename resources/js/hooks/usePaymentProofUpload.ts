import { getCsrfHeaders } from '@/lib/csrf';

export type PaymentProofUploadResult =
    | { ok: true; data: any }
    | { ok: false; message: string };

// Wraps the POST to /customer/orders/{orderId}/gcash-proof or /cod-proof —
// same FormData `screenshot` field and X-CSRF-TOKEN header both pages/modals
// already used. Error handling is standardized to read the server's JSON
// error message (CustomerController's uploadGcashProof/uploadCodProof both
// return `{ error: '...' }`; the resubmit modal already read `err.message`)
// so both keys are checked before falling back to a generic message.
export function usePaymentProofUpload(kind: 'gcash' | 'cod') {
    const upload = async (orderId: number, file: File): Promise<PaymentProofUploadResult> => {
        try {
            const formData = new FormData();
            formData.append('screenshot', file);
            const res = await fetch(`/customer/orders/${orderId}/${kind}-proof`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { ...getCsrfHeaders() },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                return { ok: true, data };
            }
            const err = await res.json().catch(() => ({}));
            return { ok: false, message: err.message || err.error || 'Upload failed. Please try again.' };
        } catch {
            return { ok: false, message: 'Upload failed. Please try again.' };
        }
    };

    return { upload };
}
