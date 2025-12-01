import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProduct, fetchCategories, updateProduct } from "../utils/api";
import { Spinner } from "react-bootstrap";
import "../Styles/AddProduct.css"; 

const LoadingModal = () => (
  <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center" style={{zIndex: 2000}}>
    <div className="bg-white p-4 rounded shadow text-center">
      <Spinner animation="border" variant="primary" className="mb-3" style={{width: '3rem', height: '3rem'}} />
      <h5 className="mb-0 text-dark fw-bold">Processing...</h5>
    </div>
  </div>
);

const EditProduct = () => {
    // 'productId' in URL might now be a SLUG (e.g. "fresh-milk")
    const { productId } = useParams(); 
    const navigate = useNavigate();
    
    const [loadingData, setLoadingData] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [categories, setCategories] = useState([]);
    
    // Store the REAL numeric ID for the update call
    const [realId, setRealId] = useState(null); 

    const [form, setForm] = useState({ name: "", description: "", categoryId: "", imageUrl: "", stock: "", price: "", discount: "" });

    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true);
            try {
                const catData = await fetchCategories();
                setCategories(catData);
                
                // Fetch using slug or ID (Backend handles both)
                const product = await fetchProduct(productId);
                
                // Save the numeric ID for later use in updateProduct()
                setRealId(product.id); 

                setForm({
                    name: product.product_name,
                    description: product.description || "",
                    categoryId: product.category_id,
                    imageUrl: product.image_url || "",
                    stock: product.stock,
                    price: product.price,
                    discount: product.discount || 0,
                });
            } catch (error) {
                alert("Failed to load product.");
                navigate("/admin");
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, [productId, navigate]);

    const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        
        const payload = {
            product_name: form.name,
            description: form.description,
            category_id: parseInt(form.categoryId),
            image_url: form.imageUrl,
            stock: parseInt(form.stock),
            price: parseFloat(form.price),
            discount: parseFloat(form.discount),
        };

        try {
            // Use realId (numeric) for the PUT request
            await updateProduct(realId, payload);
            alert("Product Updated Successfully!");
            navigate("/admin");
        } catch (error) {
            alert(error.message || "Failed to update product");
        } finally {
            setProcessing(false);
        }
    };

    if (loadingData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    return (
        <div className="ap-page-background font-sans position-relative">
            {processing && <LoadingModal />}

            <div className="ap-container">
                <h2 className="ap-header">Edit Product: {form.name}</h2>
                <div className="ap-card">
                    <form id="edit-product-form" className="ap-form-grid" onSubmit={handleSubmit}>
                        <div>
                            <div className="ap-field"><label className="ap-label">Product Name</label><input name="name" value={form.name} onChange={handleChange} className="ap-input" required disabled={processing} /></div>
                            <div className="ap-field"><label className="ap-label">Description</label><input name="description" value={form.description} onChange={handleChange} className="ap-input" disabled={processing} /></div>
                            <div className="ap-field"><label className="ap-label">Category</label><select name="categoryId" value={form.categoryId} onChange={handleChange} className="ap-input" required disabled={processing}><option value="" disabled>Select a category</option>{categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.category_name || cat.name}</option>))}</select></div>
                            <div className="ap-field"><label className="ap-label">Image URL</label><input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="ap-input" disabled={processing} /></div>
                        </div>
                        <div>
                            <div className="ap-field"><label className="ap-label">Stock</label><input name="stock" type="number" value={form.stock} onChange={handleChange} className="ap-input" disabled={processing} /></div>
                            <div className="ap-field"><label className="ap-label">Price (₱)</label><input name="price" type="number" value={form.price} onChange={handleChange} className="ap-input" required disabled={processing} /></div>
                            <div className="ap-field"><label className="ap-label">Discount (%)</label><input name="discount" type="number" value={form.discount} onChange={handleChange} className="ap-input" disabled={processing} /></div>
                            <div className="ap-field-spacer"></div>
                        </div>
                    </form>
                    <div className="ap-actions">
                        <button type="submit" form="edit-product-form" className="ap-btn ap-btn-create" disabled={processing}>{processing ? 'Saving...' : 'Save Changes'}</button>
                        <button type="button" className="ap-btn ap-btn-cancel" onClick={() => navigate("/admin")} disabled={processing}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EditProduct;