<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureOtpVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. If not logged in, go to login
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // 2. If logged in but OTP session flag is missing or false
        if (!session('otp_verified', false)) {
            return redirect()->route('otp.view');
        }

        return $next($request);
    }
}