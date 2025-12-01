<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash; 

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        
        User::firstOrCreate(
            ['email' => 'jakestore307@gmail.com'],
            [
                'username' => 'admin',
                'first_name' => 'Super',
                'last_name'  => 'Admin',
                'password'   => Hash::make('password'), 
                'phone_number' => '09123456789',
                'address'    => 'Headquarters',
                'is_admin'   => true,
                'email_verified_at' => now(), 
            ]
        );

    
        
        // Create Categories first
        $categories = Category::factory(4)->create();

        // Create Products using the existing categories
        $products = Product::factory(9)
            ->recycle($categories) 
            ->create();

        // Create Users and link related data to them
        User::factory(100)
            ->create()
            ->each(function ($user) use ($products) {
                
                // --- SEED CART ---
                $cart = Cart::factory()->create([
                    'user_id' => $user->id
                ]);

                // Pick 1-4 UNIQUE products first.
                $cartProducts = $products->random(rand(1, 4));

                foreach ($cartProducts as $product) {
                    CartItem::factory()->create([
                        'cart_id' => $cart->id,
                        'product_id' => $product->id,
                    ]);
                }

                // --- SEED ORDERS ---
                Order::factory(rand(0, 5))->create([
                    'user_id' => $user->id
                ])->each(function ($order) use ($products) {
                    
                    // Pick 1-10 UNIQUE products for this specific order
                    $orderProducts = $products->random(rand(1, 9));
                    $totalAmount = 0; // Added variable to track total

                    foreach ($orderProducts as $product) {
                        $qty = rand(1, 5); // Generate quantity once to use for math

                        OrderItem::factory()->create([
                            'order_id' => $order->id,
                            'product_id' => $product->id,
                            'quantity' => $qty, // Ensure quantity is saved
                            'price_at_purchase' => $product->price, 
                        ]);

                        // Sum up the total
                        $totalAmount += ($product->price * $qty);
                    }

                    // Update the Order Total (Crucial for accurate reports)
                    $order->update(['total_amount' => $totalAmount]);
                });
            });
            
     
    }
}