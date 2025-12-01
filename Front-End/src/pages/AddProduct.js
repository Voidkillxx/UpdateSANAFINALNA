import React, { useState, useEffect } from "react";
import "../Styles/AddProduct.css";
import { useNavigate } from "react-router-dom";

const AddProduct = ({ onCancel, onProductAdded }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state matches DB column names where possible, or mapped later
    const [form, setForm] = useState({
        name: "",
        description: "",
        categoryId: "",  
        imageUrl: "",
        stock: "",
        price: "",
        discount: "",
    });

    // 1. Fetch Categories from DB
    useEffect(() => {
        fetch('http://localhost:8095/api/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Error loading categories:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleBack = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate('/admin'); // Fallback to admin dashboard
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!form.name || !form.price || !form.categoryId) {
            alert("Please fill in all required fields (Name, Price, and Category)");
            setLoading(false);
            return;
        }

        // 2. Prepare Data for Laravel (Map fields to DB columns)
        const productPayload = {
            product_name: form.name,       // Map 'name' -> 'product_name'
            description: form.description,
            category_id: parseInt(form.categoryId), // Map 'categoryId' -> 'category_id'
            image_url: form.imageUrl,      // Map 'imageUrl' -> 'image_url'
            stock: parseInt(form.stock) || 0,
            price: parseFloat(form.price),
            // discount: parseFloat(form.discount) || 0, // Only include if your DB has a 'discount' column
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8095/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Required for Admin action
                },
                body: JSON.stringify(productPayload)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Product Created Successfully!");
                
                // Reset form
                setForm({
                    name: "", description: "", categoryId: "", imageUrl: "", stock: "", price: "", discount: "",
                });

                // Notify parent if needed (e.g. refresh list)
                if (onProductAdded) onProductAdded(data);
                handleBack(); // Use handleBack to close or navigate
            } else {
                alert(data.message || "Failed to create product");
            }
        } catch (error) {
            console.error("Error creating product:", error);
            alert("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ap-page-background font-sans">
            <div className="ap-container">
                {/* Header with Back Button */}
                <div className="ap-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button 
                        onClick={handleBack} 
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            padding: 0,
                            color: 'inherit'
                        }}
                        title="Go Back"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <h2 style={{ margin: 0 }}>Add Products</h2>
                </div>

                <div className="ap-card">
                    <form id="add-product-form" className="ap-form-grid" onSubmit={handleSubmit}>
                        <div>
                            <div className="ap-field">
                                <label className="ap-label">Product Name</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="ap-input"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="ap-field">
                                <label className="ap-label">Description</label>
                                <input
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="ap-input"
                                    disabled={loading}
                                />
                            </div>
                            <div className="ap-field">
                                <label className="ap-label">Category</label>
                                <select
                                    name="categoryId"
                                    value={form.categoryId}
                                    onChange={handleChange}
                                    className="ap-input"
                                    required
                                    disabled={loading}
                                >
                                    <option value="" disabled>Select a category</option>
                                    {/* Map dynamic categories from DB */}
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.category_name || cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="ap-field">
                                <label className="ap-label">Image URL</label>
                                <input
                                    name="imageUrl"
                                    value={form.imageUrl}
                                    onChange={handleChange}
                                    className="ap-input"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="ap-field">
                                <label className="ap-label">Stock</label>
                                <input
                                    name="stock"
                                    type="number"
                                    value={form.stock}
                                    onChange={handleChange}
                                    className="ap-input"
                                    disabled={loading}
                                />
                            </div>
                            <div className="ap-field">
                                <label className="ap-label">Price (₱)</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={form.price}
                                    onChange={handleChange}
                                    className="ap-input"
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="ap-field">
                                <label className="ap-label">Discount (%)</label>
                                <input
                                    name="discount"
                                    type="number"
                                    value={form.discount}
                                    onChange={handleChange}
                                    className="ap-input"
                                    disabled={loading}
                                />
                            </div>
                            <div className="ap-field-spacer"></div>
                        </div>
                    </form>

                    <div className="ap-actions">
                        <button type="submit" form="add-product-form" className="ap-btn ap-btn-create" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>
                        <button type="button" className="ap-btn ap-btn-cancel" onClick={handleBack} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;