<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Find user
        $user = User::where('email', $request->email)->first();

        // 2. Verify password against 'password_hash' column
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        // 3. Create Token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Return user and token
        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user // Full user object
        ], 200);
    }
}