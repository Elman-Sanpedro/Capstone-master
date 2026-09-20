<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Inventory;
use App\Models\StockLog;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        try {
            $products = Product::with(['category', 'inventory'])
                ->where('is_active', true)
                ->get()
                ->map(function ($product) {
                    return [
                        'product_id' => $product->product_id,
                        'product_name' => $product->product_name,
                        'category' => $product->category ? $product->category->category_name : 'Unknown',
                        'description' => $product->description,
                        'unit' => $product->unit,
                        'price' => $product->price,
                        'price_per_case' => $product->price_per_case,
                        'price_per_case_cold' => $product->price_per_case_cold,
                        'price_per_bottle' => $product->price_per_bottle,
                        'current_quantity' => $product->inventory ? $product->inventory->current_quantity : 0,
                        'min_stock_level' => $product->inventory ? $product->inventory->min_stock_level : 0,
                        'is_low_stock' => $product->inventory && $product->inventory->isLowStock(),
                    ];
                });

            $categories = Category::all();
            
            // Get low stock products
            $lowStockProducts = $products->filter(function ($product) {
                return $product['is_low_stock'];
            })->map(function ($product) {
                return [
                    'product' => [
                        'product_name' => $product['product_name']
                    ],
                    'current_quantity' => $product['current_quantity'],
                    'min_stock_level' => $product['min_stock_level']
                ];
            })->values();
            
        } catch (\Exception $e) {
            // Return empty arrays on error
            $products = collect([]);
            $categories = collect([]);
            $lowStockProducts = collect([]);
        }

        return Inertia::render('admin/inventory', [
            'products' => $products,
            'categories' => $categories,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }

    public function addStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'quantity' => 'required|numeric|min:0.01',
            'transaction_type' => 'required|in:STOCK_IN,STOCK_OUT,RETURN',
            'notes' => 'nullable|string|max:500',
        ]);

        $product = Product::find($request->product_id);
        
        // Get or create inventory record
        $inventory = Inventory::firstOrCreate(
            ['product_id' => $product->product_id],
            [
                'current_quantity' => 0,
                'min_stock_level' => 10,
                'last_updated' => now(),
            ]
        );

        // Check if sufficient stock for STOCK_OUT
        if ($request->transaction_type === 'STOCK_OUT' && $inventory->current_quantity < $request->quantity) {
            return back()->with('error', "Insufficient stock. Current: {$inventory->current_quantity}, Requested: {$request->quantity}");
        }

        // Update inventory quantity
        if ($request->transaction_type === 'STOCK_IN' || $request->transaction_type === 'RETURN') {
            $inventory->increment('current_quantity', $request->quantity);
        } else {
            $inventory->decrement('current_quantity', $request->quantity);
        }

        $inventory->update(['last_updated' => now()]);

        // Create stock log
        StockLog::create([
            'product_id' => $product->product_id,
            'user_id' => Auth::id(),
            'transaction_type' => $request->transaction_type,
            'quantity' => $request->quantity,
            'transaction_date' => now(),
            'notes' => $request->notes,
        ]);

        $action = $request->transaction_type === 'STOCK_IN' ? 'added' : ($request->transaction_type === 'STOCK_OUT' ? 'removed' : 'returned');
        return back()->with('success', "Stock {$action} successfully for {$product->product_name}");
    }

    public function updateMinStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'min_stock_level' => 'required|numeric|min:0',
        ]);

        $inventory = Inventory::where('product_id', $request->product_id)->first();
        
        if ($inventory) {
            $inventory->update([
                'min_stock_level' => $request->min_stock_level,
                'last_updated' => now(),
            ]);
        } else {
            Inventory::create([
                'product_id' => $request->product_id,
                'current_quantity' => 0,
                'min_stock_level' => $request->min_stock_level,
                'last_updated' => now(),
            ]);
        }

        return back()->with('success', 'Minimum stock level updated successfully');
    }

    public function createProduct(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,category_id',
            'description' => 'nullable|string',
            'unit' => 'required|string|max:50',
            'price' => 'nullable|numeric|min:0',
            'price_per_case' => 'nullable|numeric|min:0',
            'price_per_case_cold' => 'nullable|numeric|min:0',
            'price_per_bottle' => 'nullable|numeric|min:0',
            'initial_quantity' => 'required|numeric|min:0',
            'min_stock_level' => 'required|numeric|min:0',
        ]);

        // Determine the price to use
        $finalPrice = $request->price;

        // If beverage pricing is provided, use case price as main price
        if ($request->filled('price_per_case') && $request->filled('price_per_bottle')) {
            $finalPrice = $request->price_per_case;
        }

        // Create product
        $product = Product::create([
            'product_name' => $request->product_name,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'unit' => $request->unit,
            'price' => $finalPrice,
            'price_per_case' => $request->price_per_case,
            'price_per_case_cold' => $request->price_per_case_cold,
            'price_per_bottle' => $request->price_per_bottle,
            'is_active' => true,
        ]);

        // Create inventory record
        Inventory::create([
            'product_id' => $product->product_id,
            'current_quantity' => $request->initial_quantity,
            'min_stock_level' => $request->min_stock_level,
            'last_updated' => now(),
        ]);

        // Log initial stock
        if ($request->initial_quantity > 0) {
            StockLog::create([
                'product_id' => $product->product_id,
                'user_id' => Auth::id(),
                'transaction_type' => 'STOCK_IN',
                'quantity' => $request->initial_quantity,
                'transaction_date' => now(),
                'notes' => 'Initial stock',
            ]);
        }

        return back()->with('success', "Product {$product->product_name} created successfully");
    }

    public function updateProduct(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'product_name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,category_id',
            'description' => 'nullable|string',
            'unit' => 'required|string|max:50',
            'price' => 'required|numeric|min:0',
            'min_stock_level' => 'required|numeric|min:0',
        ]);

        $product = Product::find($request->product_id);
        
        // Update product
        $product->update([
            'product_name' => $request->product_name,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'unit' => $request->unit,
            'price' => $request->price,
        ]);

        // Update inventory record
        $inventory = Inventory::where('product_id', $request->product_id)->first();
        if ($inventory) {
            $inventory->update([
                'min_stock_level' => $request->min_stock_level,
                'last_updated' => now(),
            ]);
        } else {
            Inventory::create([
                'product_id' => $product->product_id,
                'current_quantity' => 0,
                'min_stock_level' => $request->min_stock_level,
                'last_updated' => now(),
            ]);
        }

        return back()->with('success', "Product {$product->product_name} updated successfully");
    }

    public function archiveProduct(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
        ]);

        $product = Product::find($request->product_id);
        
        // Soft delete by setting is_active to false
        $product->update([
            'is_active' => false,
        ]);

        return back()->with('success', "Product {$product->product_name} archived successfully");
    }
}
