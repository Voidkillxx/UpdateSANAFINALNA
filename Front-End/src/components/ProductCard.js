import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../Styles/ProductCard.css';
import { calculateSellingPrice } from '../utils/PricingUtils'; 

const ProductCard = ({ product, onAddToCart }) => {
  if (!product) {
    return null;
  }

  // Handle discounts (if your backend supports it, otherwise default to 0)
  const discount = product.discount || 0;
  const hasDiscount = discount > 0;
  const sellingPrice = calculateSellingPrice(product.price, discount); 

  // FIX: Use Slug for URL (Fall back to ID if slug is missing)
  const productLink = `/product/${product.slug || product.id}`;

  return (
    <Card className="product-card shadow-sm h-100">
      <Link to={productLink}>
        <Card.Img
          variant="top"
          // FIX: Use 'image_url' from DB
          src={product.image_url || '/img/placeholder.png'}
          // FIX: Use 'product_name' from DB
          alt={product.product_name}
          className="product-card-image"
          style={{ objectFit: 'contain', height: '180px', padding: '10px' }}
          onError={(e) => { e.target.onerror = null; e.target.src = '/img/placeholder.png'; }}
        />
      </Link>
      <Card.Body className="d-flex flex-column text-center">
        <div className="flex-grow-1">
          <Card.Title className="product-card-title" style={{ fontSize: '1rem' }}>
            <Link to={productLink} className="product-card-link text-decoration-none text-dark">
              {/* FIX: Use 'product_name' from DB */}
              {product.product_name}
            </Link>
          </Card.Title>
          
          {/* Price Display */}
          <div className="product-card-price-section mt-2">
            {hasDiscount ? (
              <>
                <div className="product-card-price text-success fw-bold">
                  ₱{sellingPrice.toFixed(2)}
                </div>
                <div className="product-card-original-price text-muted text-decoration-line-through small">
                  ₱{Number(product.price).toFixed(2)}
                </div>
                <div className="product-card-discount-badge badge bg-danger mt-1">
                  {discount}% OFF
                </div>
              </>
            ) : (
              <div className="product-card-price text-success fw-bold">
                ₱{Number(product.price).toFixed(2)}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3">
            {parseInt(product.stock) > 0 ? (
                <Button
                  variant="success"
                  className="add-to-cart-button w-100"
                  onClick={() => onAddToCart(product)}
                >
                  Add to cart
                </Button>
            ) : (
                <Button variant="secondary" className="w-100" disabled>
                  Out of Stock
                </Button>
            )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;