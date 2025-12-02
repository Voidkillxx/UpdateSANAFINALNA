<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 100, 5000);
        
        $shippingFee = 50.00;

        return [
            'user_id' => User::factory(),
            
          
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'total_amount' => $subtotal + $shippingFee, 
            
            'status' => fake()->randomElement(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']),
            'payment_type' => fake()->randomElement(['Card', 'Cash On Delivery']),
            'shipping_address' => fake()->address(),
        ];
    }
}