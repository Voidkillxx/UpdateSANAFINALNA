<?php

namespace App\Http\Controllers;

use App\Models\Otp;
use App\Mail\OtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log; 
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\User;

class OtpController extends Controller
{
    // --- 1. PUBLIC: PRE-CHECK OTP (For Forgot Password) ---
    public function checkOtpPublic(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $otpRecord = Otp::where('user_id', $user->id)->first();

        if (!$otpRecord || $otpRecord->code != $request->code) {
            return response()->json(['message' => 'Invalid OTP Code'], 400);
        }

        if ($otpRecord->isExpired()) {
            return response()->json(['message' => 'OTP Expired'], 400);
        }

        return response()->json(['message' => 'OTP Verified']);
    }

    // --- 2. LOGGED IN: PRE-CHECK OTP (For Profile Changes) ---
    public function checkOtp(Request $request)
    {
        $request->validate(['code' => 'required|digits:6']);
        $user = $request->user();

        $otpRecord = Otp::where('user_id', $user->id)->first();

        if (!$otpRecord || $otpRecord->code != $request->code) {
            return response()->json(['message' => 'Invalid OTP Code'], 400);
        }

        if ($otpRecord->isExpired()) {
            return response()->json(['message' => 'OTP Expired'], 400);
        }

        return response()->json(['message' => 'OTP Verified']);
    }

    // --- 3. USED BY AUTH CONTROLLER (Register/Login) ---
    public function sendOtpApi(User $user)
    {
        $this->generateAndSend($user, $user->email);
    }

    // --- 4. AUTHENTICATED REQUEST (Profile Page - Change Email/Pass) ---
    // This handles the POST /api/user/request-otp from React
    public function sendOtpAuthenticated(Request $request)
    {
        $user = $request->user();
        
        // Default target: The current user's email (e.g. for Password change)
        $destinationEmail = $user->email; 

        // CHECK: Is the user trying to change their email?
        // If the React form sent an 'email' field, we use THAT as the destination.
        if ($request->filled('email')) {
            // <--- ADDED: Validation to require current_password when changing email
            $request->validate([
                'email' => 'required|email',
                'current_password' => 'required' 
            ]);

            // <--- ADDED: Check the password before sending OTP
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Incorrect password provided.'], 403);
            }

            // OVERRIDE: Send OTP to the NEW email
            $destinationEmail = $request->email;
        }

        // Send to the determined email
        $this->generateAndSend($user, $destinationEmail);

        return response()->json([
            'message' => "OTP Code sent to " . $destinationEmail
        ]);
    }

    // --- 5. GENERATOR FUNCTION ---
    private function generateAndSend(User $user, string $targetEmail) 
    {
        $code = rand(100000, 999999);
        $names = explode(' ', $user->first_name);
        $firstName = $names[0] ?? 'User';

        $intro = "Hi {$firstName},\nUse the code below to verify your request.";
        $outro = "If you did not request this change, please ignore this email.";

        // Security: Delete old OTPs for this user
        Otp::where('user_id', $user->id)->delete();
        
        // Create new OTP linked to User ID
        Otp::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(5)
        ]);

        // Send email to the TARGET email (New or Current)
        try {
            Mail::to($targetEmail)->send(new OtpMail($code, $intro, $outro));
            Log::info("OTP $code sent to $targetEmail for User ID {$user->id}");
        } catch (\Exception $e) {
            Log::error("Failed to send OTP to $targetEmail: " . $e->getMessage());
        }
    }

    // --- 6. VERIFY OTP (Login Flow) ---
    public function verifyOtpApi(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $otpRecord = Otp::where('user_id', $user->id)->first();

        if (!$otpRecord || $otpRecord->code != $request->code) {
            return response()->json(['message' => 'Invalid Code'], 400);
        }

        if ($otpRecord->isExpired()) {
            return response()->json(['message' => 'Code Expired'], 400);
        }

        $otpRecord->delete();

        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'message' => 'Login Successful',
            'token' => $token,
            'user' => $user
        ], 200);
    }
}