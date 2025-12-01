<?php

namespace Database\Factories;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class CartItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cart_id' => fake()->numberBetween(1,10),    
            'product_id' => fake()->numberBetween(1,100), 
            'quantity' => fake()->numberBetween(1, 5), 
        ];
    }
}