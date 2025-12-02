<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OtpController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CartItemController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;

/*
|--------------------------------------------------------------------------
| 1. PUBLIC ROUTES (No Login Required)
|--------------------------------------------------------------------------
*/

// --- AUTHENTICATION ---
Route::post('/register', [AuthController::class, 'registerApi']); 
Route::post('/login', [AuthController::class, 'loginApi']); 
Route::post('/otp/verify', [OtpController::class, 'verifyOtpApi']);
Route::post('/otp/check', [OtpController::class, 'checkOtpPublic']);
Route::post('/resend-otp', [AuthController::class, 'resendOtpApi']);

// --- PASSWORD RESET ---
Route::post('/forgot-password', [AuthController::class, 'forgotPasswordApi']);
Route::post('/reset-password', [AuthController::class, 'resetPasswordApi']);

// --- CATALOG ---
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{category}', [CategoryController::class, 'show']);

/*
|--------------------------------------------------------------------------
| 2. PROTECTED ROUTES (Login Required)
|--------------------------------------------------------------------------
| Request MUST contain header: 'Authorization: Bearer <token>'
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- AUTH ---
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- USER PROFILE & SECURITY ---
    Route::get('/user/profile', [UserController::class, 'profile']); 
    Route::put('/user/profile', [UserController::class, 'updateProfile']); 
    Route::post('/user/request-otp', [OtpController::class, 'sendOtpAuthenticated']);
    Route::post('/user/check-otp', [OtpController::class, 'checkOtp']); 
    Route::put('/user/password', [UserController::class, 'changePassword']);
    Route::put('/user/email', [UserController::class, 'changeEmail']);

    // --- CART ---
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartItemController::class, 'store']); 
    Route::put('/cart/items/{id}', [CartItemController::class, 'update']); 
    Route::delete('/cart/items/{id}', [CartItemController::class, 'destroy']); 
    Route::delete('/cart/clear', [CartController::class, 'clearCart']); 

    // --- ORDERS ---
    Route::post('/checkout', [OrderController::class, 'checkout']); 
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    
    // --- ORDER ITEMS ---
    Route::get('/order-items', [OrderItemController::class, 'index']);
    Route::get('/order-items/{id}', [OrderItemController::class, 'show']);

    // --- ADMIN (Products, Categories, Order Status) ---
    // Note: In a real app, use middleware like 'can:admin' for these
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']); 
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    
    Route::put('/admin/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::apiResource('users', UserController::class)->except(['store']); 
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']); 
    Route::put('/orders/{id}/request-cancel', [OrderController::class, 'requestCancel']);
    Route::put('/orders/{id}/receive', [OrderController::class, 'markAsReceived']);
});