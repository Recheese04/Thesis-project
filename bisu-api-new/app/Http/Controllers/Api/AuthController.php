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

        // 1. Find user
        $user = User::where('email', $request->email)->first();

        // 2. Verify password
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // 3. Check account is active
        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        // 4. Load student profile
        $user->load(['student', 'userType']);

        // 5. Determine role from organization_members table
        //    - No student_id       → admin
        //    - officer/adviser row → officer
        //    - member row only     → member
        $role           = 'admin';
        $membership     = null;
        $organizationId = null;

        if ($user->student_id) {
            $membership = MemberOrganization::where('student_id', $user->student_id)
                ->where('status', 'active')
                ->orderByRaw("FIELD(role, 'adviser', 'officer', 'member')") // prioritize officer roles
                ->first();

            if ($membership) {
                $role           = in_array($membership->role, ['officer', 'adviser']) ? 'officer' : 'member';
                $organizationId = $membership->organization_id;
            } else {
                $role = 'member'; // has student_id but no membership yet
            }
        }

        // 6. Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 7. Return everything the frontend needs
        return response()->json([
            'message'         => 'Login successful',
            'token'           => $token,
            'user'            => $user,
            'role'            => $role,            // 'admin' | 'officer' | 'member'
            'membership'      => $membership,      // full OrganizationMember record or null
            'organization_id' => $organizationId,  // the org they manage, or null
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
            $membership = MemberOrganization::where('student_id', $user->student_id)
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
            'membership'      => $membership,
            'organization_id' => $organizationId,
        ]);
    }
}