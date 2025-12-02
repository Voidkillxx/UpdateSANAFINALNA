<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Otp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // --- ADMIN METHODS ---
    public function index(Request $request) 
    { 
        if (!$request->user()->is_admin) return response()->json(['message' => 'Forbidden'], 403);
        return response()->json(User::all(), 200); 
    }

    public function show(Request $request, $id) 
    { 
        if (!$request->user()->is_admin) return response()->json(['message' => 'Forbidden'], 403);
        return response()->json(User::find($id), 200); 
    }

    public function update(Request $request, $id) 
    { 
        if (!$request->user()->is_admin) return response()->json(['message' => 'Forbidden'], 403);
        $user = User::find($id);
        if (!$user) return response()->json(['message' => 'User not found'], 404);
        $user->update($request->all()); 
        return response()->json(['message' => 'User updated', 'user' => $user], 200); 
    }

    public function destroy(Request $request, $id) 
    { 
        if (!$request->user()->is_admin) return response()->json(['message' => 'Forbidden'], 403);
        $user = User::find($id);
        if (!$user) return response()->json(['message' => 'User not found'], 404);
        $user->delete();
        return response()->json(['message' => 'User deleted'], 200); 
    }

    // --- SELF-SERVICE PROFILE METHODS ---

    public function profile(Request $request) {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request) {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:30',
            'address' => 'required|string|max:255',
            'zipcode' => 'required|string|max:10', // <--- Validate
        ]);
        
        // Update with zipcode
        $user->update($request->only(['first_name', 'last_name', 'phone_number', 'address', 'zipcode']));
        return response()->json(['message' => 'Profile updated successfully!', 'user' => $user]);
    }

    public function changePassword(Request $request) {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
            'otp' => 'required|digits:6'
        ]);

        $otpRecord = Otp::where('user_id', $user->id)->first();
        if (!$otpRecord || $otpRecord->code != $request->otp) return response()->json(['message' => 'Invalid OTP Code'], 400);
        
        if (!Hash::check($request->current_password, $user->password)) return response()->json(['message' => 'Current password incorrect.'], 400);

        $user->update(['password' => Hash::make($request->new_password)]);
        $otpRecord->delete();

        return response()->json(['message' => 'Password changed successfully!']);
    }

    public function changeEmail(Request $request) {
        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'otp' => 'required|digits:6'
        ]);

        $otpRecord = Otp::where('user_id', $user->id)->first();
        if (!$otpRecord || $otpRecord->code != $request->otp) return response()->json(['message' => 'Invalid OTP Code'], 400);

        $user->update(['email' => $request->email, 'email_verified_at' => null]);
        $otpRecord->delete();

        return response()->json(['message' => 'Email updated successfully!', 'user' => $user]);
    }
}