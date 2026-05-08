<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentFee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayMongoController extends Controller
{
    public function createCheckoutSession(Request $request, $feeId)
    {
        $fee = StudentFee::with(['feeType', 'user', 'organization'])->findOrFail($feeId);

        // Authorization: Ensure the fee belongs to the user
        if ($fee->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $secretKey = config('services.paymongo.secret_key');
        $baseUrl = config('services.paymongo.base_url');

        if (!$secretKey) {
            return response()->json(['message' => 'PayMongo Secret Key not configured.'], 500);
        }

        try {
            $amount = (int)($fee->feeType->amount * 100); // PayMongo expects amount in cents

            $response = Http::withoutVerifying()->withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'Authorization' => 'Basic ' . base64_encode($secretKey . ':'),
            ])->post($baseUrl . '/checkout_sessions', [
                'data' => [
                    'attributes' => [
                        'send_email_receipt' => true,
                        'show_description' => true,
                        'show_line_items' => true,
                        'line_items' => [
                            [
                                'currency' => 'PHP',
                                'amount' => $amount,
                                'description' => $fee->feeType->name,
                                'name' => $fee->feeType->name,
                                'quantity' => 1,
                            ],
                        ],
                        'payment_method_types' => ['card', 'gcash', 'paymaya'],
                        'description' => "Payment for {$fee->feeType->name} - {$fee->organization->name}",
                    ],
                ],
            ]);

            if ($response->failed()) {
                Log::error('PayMongo Session Creation Failed', ['response' => $response->json()]);
                return response()->json(['message' => 'Failed to initiate payment session.'], 500);
            }

            $sessionData = $response->json()['data'];
            
            return response()->json([
                'checkout_url' => $sessionData['attributes']['checkout_url'],
                'session_id' => $sessionData['id'],
            ]);

        } catch (\Exception $e) {
            Log::error('PayMongo Error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An error occurred while connecting to PayMongo.'], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        // For production, you must verify the signature
        // For now, this is a placeholder for receiving payment.paid events
        $event = $request->input('data.attributes.type');
        
        if ($event === 'checkout_session.payment.paid') {
            // Logic to find the fee and mark as paid
            // We would need to store the session_id in the student_fees table to link them back
        }

        return response()->json(['status' => 'ok']);
    }
}
