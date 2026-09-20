<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentConfirmationController extends Controller
{
    public function index()
    {
        $pendingPayments = Sale::where('payment_status', 'pending')
            ->where('payment_method', 'gcash')
            ->with(['order', 'recordedByUser'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'pending_payments' => $pendingPayments
        ]);
    }

    public function confirmPayment(Request $request, $saleId)
    {
        $request->validate([
            'notes' => 'nullable|string|max:500'
        ]);

        $sale = Sale::findOrFail($saleId);
        
        if ($sale->payment_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Payment is not pending confirmation'
            ], 400);
        }

        $sale->payment_status = 'confirmed';
        $sale->payment_notes = $request->notes;
        $sale->confirmed_by = Auth::id();
        $sale->confirmed_at = now();
        $sale->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed successfully'
        ]);
    }

    public function rejectPayment(Request $request, $saleId)
    {
        $request->validate([
            'notes' => 'required|string|max:500'
        ]);

        $sale = Sale::findOrFail($saleId);
        
        if ($sale->payment_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Payment is not pending confirmation'
            ], 400);
        }

        $sale->payment_status = 'rejected';
        $sale->payment_notes = $request->notes;
        $sale->rejected_by = Auth::id();
        $sale->rejected_at = now();
        $sale->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment rejected successfully'
        ]);
    }

    public function getPaymentDetails($saleId)
    {
        $sale = Sale::with(['order', 'recordedByUser'])
            ->findOrFail($saleId);

        return response()->json([
            'sale' => $sale
        ]);
    }
}
