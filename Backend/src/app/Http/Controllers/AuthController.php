<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Otp; 
use App\Mail\OtpMail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Http\Controllers\OtpController;

class AuthController extends Controller
{
    // --- API REGISTER ---
    public function registerApi(Request $request) {
        $request->validate([
            'username' => 'required|unique:users',
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email|unique:users',
            'phone_number' => 'required',
            'address' => 'required',
            'zipcode' => 'required|string|max:10', // <--- Validation
            'password' => 'required|min:8'
        ]);

        $user = User::create([
            'username' => $request->username,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'zipcode' => $request->zipcode, // <--- Save to DB
            'password' => Hash::make($request->password),
        ]);

        $otpController = new OtpController();
        $otpController->sendOtpApi($user);

        return response()->json([
            'message' => 'Account created! OTP sent to your email.',
            'email' => $user->email,
            'require_otp' => true
        ], 201);
    }

    // --- API LOGIN ---
    public function loginApi(Request $request) {
        $request->validate([
            'login_id' => 'required',
            'password' => 'required'
        ]);

        $fieldType = filter_var($request->login_id, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($fieldType, $request->login_id)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $otpController = new OtpController();
        $otpController->sendOtpApi($user);

        return response()->json([
            'message' => 'Credentials valid. OTP sent.',
            'email' => $user->email,
            'require_otp' => true
        ]);
    }

    // --- RESEND OTP ---
    public function resendOtpApi(Request $request) {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $otpController = new OtpController();
        $otpController->sendOtpApi($user);

        return response()->json(['message' => 'New code sent! Check your email.']);
    }

    // --- FORGOT PASSWORD ---
    public function forgotPasswordApi(Request $request) {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $code = rand(100000, 999999);
        $firstName = explode(' ', $user->first_name)[0] ?? 'User';
        $intro = "Hi {$firstName},\nUse the code below to complete your verification process.";
        $outro = "Thanks,\nThe Jake Store Team";

        Otp::where('user_id', $user->id)->delete();
        Otp::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(5)
        ]);

        try {
            Mail::to($user->email)->send(new OtpMail($code, $intro, $outro));
        } catch (\Exception $e) {
            Log::error("Failed to send Reset OTP: " . $e->getMessage());
            return response()->json(['message' => 'Failed to send email'], 500);
        }

        return response()->json(['message' => 'Reset code sent to your email.']);
    }

    // --- RESET PASSWORD ---
    public function resetPasswordApi(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|digits:6',
            'password' => 'required|min:8'
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);

        $otpRecord = Otp::where('user_id', $user->id)->first();
        if (!$otpRecord || $otpRecord->code != $request->code) return response()->json(['message' => 'Invalid Code'], 400);
        if ($otpRecord->isExpired()) return response()->json(['message' => 'Code Expired'], 400);

        $user->password = Hash::make($request->password);
        $user->save();
        $otpRecord->delete();

        return response()->json(['message' => 'Password reset successful! Please login.']);
    }
}