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

    
        
        $categories = Category::factory(4)->create();

        $products = Product::factory(9)
            ->recycle($categories) 
            ->create();

        User::factory(100)
            ->create()
            ->each(function ($user) use ($products) {
                
                $cart = Cart::factory()->create([
                    'user_id' => $user->id
                ]);

                $cartProducts = $products->random(rand(1, 4));

                foreach ($cartProducts as $product) {
                    CartItem::factory()->create([
                        'cart_id' => $cart->id,
                        'product_id' => $product->id,
                    ]);
                }

                Order::factory(rand(0, 5))->create([
                    'user_id' => $user->id
                ])->each(function ($order) use ($products) {
                    
                    $orderProducts = $products->random(rand(1, 9));
                    $calculatedSubtotal = 0; 

                    foreach ($orderProducts as $product) {
                        $qty = rand(1, 5); 

                        OrderItem::factory()->create([
                            'order_id' => $order->id,
                            'product_id' => $product->id,
                            'quantity' => $qty, 
                            'price_at_purchase' => $product->price, 
                        ]);

                        $calculatedSubtotal += ($product->price * $qty);
                    }

                    $shippingFee = $order->shipping_fee;
                    $finalTotal = $calculatedSubtotal + $shippingFee;

                    $order->update([
                        'subtotal' => $calculatedSubtotal,
                        'total_amount' => $finalTotal
                    ]);
                });
            });
            
     
    }
}