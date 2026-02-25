<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MemberOrganization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        $user->load(['student', 'userType']);

        $role           = 'admin';
        $membership     = null;
        $organizationId = null;

        if ($user->student_id) {
            // ✅ Load 'organization' so frontend can read membership.organization.name
            $membership = MemberOrganization::with('organization')
                ->where('student_id', $user->student_id)
                ->where('status', 'active')
                ->orderByRaw("FIELD(role, 'adviser', 'officer', 'member')")
                ->first();

            if ($membership) {
                $role           = in_array($membership->role, ['officer', 'adviser']) ? 'officer' : 'member';
                $organizationId = $membership->organization_id;
            } else {
                $role = 'member';
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'         => 'Login successful',
            'token'           => $token,
            'user'            => $user,
            'role'            => $role,
            'membership'      => $membership,
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
        $user = $request->user()->load(['student', 'userType']);

        $membership     = null;
        $organizationId = null;
        $role           = 'admin';

        if ($user->student_id) {
            // ✅ Load 'organization' so frontend can read membership.organization.name
            $membership = MemberOrganization::with('organization')
                ->where('student_id', $user->student_id)
                ->where('status', 'active')
                ->orderByRaw("FIELD(role, 'adviser', 'officer', 'member')")
                ->first();

            if ($membership) {
                $role           = in_array($membership->role, ['officer', 'adviser']) ? 'officer' : 'member';
                $organizationId = $membership->organization_id;
            } else {
                $role = 'member';
            }
        }

        return response()->json([
            'user'            => $user,
            'role'            => $role,
            'membership'      => $membership,       // includes membership.organization.name
            'organization_id' => $organizationId,   // ← this is what OfficerMembers reads
        ]);
    }
}