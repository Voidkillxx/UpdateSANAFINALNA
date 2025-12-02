<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            // FIX: Use Product factory instead of hardcoded IDs. 
            // This ensures a valid product always exists, preventing foreign key errors.
            'product_id' => Product::factory(),
            'quantity' => fake()->numberBetween(1, 10),
            'price_at_purchase' => fake()->randomFloat(2, 1, 50), 
        ];
    }
}