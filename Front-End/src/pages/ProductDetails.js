import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Image, Spinner } from 'react-bootstrap';
import '../Styles/ProductDetails.css'; 
import { calculateSellingPrice } from '../utils/PricingUtils';
import { fetchProduct } from '../utils/api'; 

const ProductDetails = ({ onAddToCart }) => {
  // CRITICAL FIX: Handle both 'slug' and 'productId' parameter names.
  // This ensures it works regardless of whether your Route is /product/:slug or /product/:productId
  const params = useParams();
  const productId = params.slug || params.productId; 
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductDetails = async () => {
      setLoading(true);
      try {
        // Use the ID or SLUG read from the URL parameter to fetch the product.
        const data = await fetchProduct(productId);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (productId) {
        loadProductDetails();
    } else {
        setLoading(false);
    }
  }, [productId]); // Reruns fetch when URL parameter changes

  const handleAddToCartClick = () => {
      if (onAddToCart && product) {
          onAddToCart(product); // Trigger modal
      }
  };

  if (loading) {
      return (
        <Container className="text-center my-5 py-5">
            <Spinner animation="border" variant="success"/>
        </Container>
      );
  }

  // If fetch was successful but returned 'Product not found' (check backend message)
  if (!product || product.message === 'Product not found') {
    return (
      <Container className="text-center my-5">
        <h2>Product not found!</h2>
        <p className="text-muted">Could not find product. (ID/Slug: {productId})</p>
        <Link to="/" className="btn btn-outline-primary mt-3">← Back</Link>
      </Container>
    );
  }

  const discount = product.discount || 0; 
  const hasDiscount = discount > 0;
  const sellingPrice = calculateSellingPrice(product.price, discount);

  return (
    <Container className="product-details-container my-3 my-md-5">
      <Row className="align-items-center">
        <Col md={6} className="text-center mb-4 mb-md-0">
          <div className="p-4 bg-light rounded-3">
             <Image 
                src={product.image_url || '/img/placeholder.png'} 
                alt={product.product_name} 
                className="product-details-image img-fluid"
                style={{maxHeight: '400px', objectFit: 'contain'}}
                onError={(e) => { e.target.onerror = null; e.target.src = '/img/placeholder.png'; }}
            />
          </div>
        </Col>
        
        <Col md={6} className="product-details-info">
          <h1 className="product-details-title fw-bold display-6">{product.product_name}</h1>
          <p className="text-muted small mb-3">Category: {product.category?.category_name || 'General'}</p>
          
          <div className="product-details-price-section mb-4">
            {hasDiscount ? (
              <>
                <h2 className="product-details-price text-success fw-bold d-inline me-3">₱{sellingPrice.toFixed(2)}</h2>
                <span className="text-decoration-line-through text-muted fs-5">₱{Number(product.price).toFixed(2)}</span>
                <span className="badge bg-danger ms-3">Save {discount}%</span>
              </>
            ) : (
              <h2 className="product-details-price text-success fw-bold">₱{Number(product.price).toFixed(2)}</h2>
            )}
          </div>

          <div className="mb-4">
             <h5>Description</h5>
             <p className="product-details-description text-secondary" style={{lineHeight:'1.6'}}>
                {product.description || "No description available."}
             </p>
          </div>
          
          <div className="mb-4">
             {parseInt(product.stock) > 0 ? (
                 <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2">
                    In Stock: {product.stock}
                 </span>
             ) : (
                 <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2">
                    Out of Stock
                 </span>
             )}
          </div>

          <div className="d-grid gap-2 d-md-block">
            <Button 
                variant="success" 
                size="lg" 
                className="product-details-button px-5 rounded-pill"
                onClick={handleAddToCartClick} 
                disabled={parseInt(product.stock) < 1}
            >
                <i className="bi bi-cart-plus me-2"></i> Add to Cart
            </Button>
          </div>

          <div className="mt-5">
            <Link to="/" className="text-decoration-none text-secondary fw-bold">← Back to All Products</Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetails;