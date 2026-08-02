<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushToken;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    /**
     * Register or update a push token for the authenticated user.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'token'       => 'required|string',
            'device_type' => 'nullable|string|in:android,ios',
        ]);

        $user = $request->user();

        // Upsert: if this token already exists for this user, update it.
        // If another user had this token (device switched accounts), reassign it.
        PushToken::updateOrCreate(
            ['token' => $data['token']],
            [
                'user_id'     => $user->id,
                'device_type' => $data['device_type'] ?? null,
            ]
        );

        return response()->json(['message' => 'Push token registered successfully.']);
    }

    /**
     * Remove a push token (e.g. on logout).
     */
    public function unregister(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
        ]);

        PushToken::where('token', $data['token'])->delete();

        return response()->json(['message' => 'Push token removed.']);
    }
}
