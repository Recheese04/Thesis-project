<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        $user->load(['college', 'course', 'userType']);

        [$role, $membership, $organizationId] = $this->resolveRole($user);

        // Revoke all existing tokens for this user before issuing a new one
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
            'role' => $role,
            'membership' => $membership,
            'organization_id' => $organizationId,
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['college', 'course', 'userType']);

        [$role, $membership, $organizationId] = $this->resolveRole($user);

        return response()->json([
            'user' => $user,
            'role' => $role,
            'membership' => $membership,
            'organization_id' => $organizationId,
        ]);
    }

    /**
     * Determine the user's effective role based on their designation.
     *
     * Priority:
     *  1. user_type_id === 1  →  admin  (always)
     *  2. Has an active designation that is NOT 'Member'  →  officer
     *  3. Everything else  →  student
     */
    private function resolveRole(User $user): array
    {
        // Admin is always admin regardless of designations
        if ($user->user_type_id == 1) {
            return ['admin', null, null];
        }

        // For everyone else, check their designations
        $membership = null;
        $organizationId = null;
        $role = 'student'; // Default fallback

        // Get all active designations, prioritize non-Member ones first
        $membership = Designation::with('organization')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByRaw("CASE WHEN designation = 'Member' THEN 1 ELSE 0 END ASC")
            ->first();

        if ($membership) {
            $organizationId = $membership->organization_id;

            // If they have a non-Member designation (President, Treasurer, etc.) → officer
            if ($membership->designation !== 'Member') {
                $role = 'officer';
            }
        }

        return [$role, $membership, $organizationId];
    }
}