<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerReport;
use App\Models\CustomerReportEvidence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomerReportController extends Controller
{
    public function index()
    {
        $reports = CustomerReport::with(['order', 'customer', 'evidence'])
            ->orderBy('created_at', 'desc')
            ->get();

        return inertia('admin/CustomerReports', [
            'reports' => $reports
        ]);
    }

    public function show($id)
    {
        $report = CustomerReport::with(['order.orderItems.product', 'customer', 'evidence', 'reviewer'])
            ->findOrFail($id);

        return inertia('admin/CustomerReportDetails', [
            'report' => $report
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $report = CustomerReport::with('order')->findOrFail($id);

        if (!in_array($report->status, ['submitted', 'under_review'])) {
            return back()->with('error', 'This report has already been reviewed and can no longer be validated or rejected.');
        }

        // The form always submits rejection_reason/action_type/refund_amount
        // (empty when not applicable to the chosen decision), and Laravel's
        // ConvertEmptyStringsToNull middleware turns those into null before
        // validation runs. Without `nullable` here, that null still gets
        // checked against `in:`/`numeric` and fails — e.g. rejecting a
        // report (action_type left blank) always 422'd on "the selected
        // action type is invalid", silently, since the form never renders
        // $errors. `nullable` lets a genuinely-absent value skip those
        // format checks while required_if still enforces it when needed.
        //
        // refund_amount is also capped at the order's total_amount: a
        // report is tied to one whole order (not a single line item), so
        // refunding more than what was actually paid for that order can
        // never be correct — without this an admin could type any number.
        $request->validate([
            'status' => 'required|in:validated,rejected',
            'admin_notes' => 'nullable|string|max:1000',
            'rejection_reason' => 'nullable|required_if:status,rejected|string|max:500',
            'action_type' => 'nullable|required_if:status,validated|in:refund,replacement',
            'refund_amount' => ['nullable', 'required_if:action_type,refund', 'numeric', 'min:0', 'max:' . $report->order->total_amount],
        ], [
            'refund_amount.max' => 'Refund amount cannot exceed the order total of ₱' . number_format($report->order->total_amount, 2) . '.',
        ]);

        // The form always submits action_type/refund_amount/rejection_reason
        // (they're just empty strings when not applicable to the chosen
        // decision). Saving '' straight into refund_amount — a decimal:2
        // cast column — throws a MathException ("Unable to cast value to a
        // decimal"), and '' isn't a valid value for action_type's enum
        // column either. Null out whichever ones don't apply to this
        // decision instead of passing the raw empty strings through.
        $actionType = $request->status === 'validated' ? $request->action_type : null;
        $refundAmount = $actionType === 'refund' ? $request->refund_amount : null;
        $rejectionReason = $request->status === 'rejected' ? $request->rejection_reason : null;

        $report->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes ?: null,
            'rejection_reason' => $rejectionReason,
            'action_type' => $actionType,
            'refund_amount' => $refundAmount,
            'reviewed_at' => now(),
            'reviewed_by' => Auth::id(),
        ]);

        return back()->with('success', 'Report status updated successfully.');
    }

    public function resolve(Request $request, $id)
    {
        $request->validate([
            'resolution_notes' => 'required|string|max:1000',
        ]);

        $report = CustomerReport::findOrFail($id);

        if ($report->status !== 'validated') {
            return back()->with('error', 'Only validated reports can be marked as resolved.');
        }

        $report->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'admin_notes' => $request->resolution_notes,
        ]);

        return back()->with('success', 'Report marked as resolved.');
    }

    public function getStats()
    {
        $stats = [
            'total_reports' => CustomerReport::count(),
            'submitted' => CustomerReport::where('status', 'submitted')->count(),
            'under_review' => CustomerReport::where('status', 'under_review')->count(),
            'validated' => CustomerReport::where('status', 'validated')->count(),
            'rejected' => CustomerReport::where('status', 'rejected')->count(),
            'resolved' => CustomerReport::where('status', 'resolved')->count(),
        ];

        return response()->json($stats);
    }
}
