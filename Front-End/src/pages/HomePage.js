import React from "react"; 
import { Link } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard"; 
import "../Styles/HomePage.css";

const HomePage = ({ products, categories, onAddToCart, loading, searchTerm }) => {

  const isSearching = searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0;

  let displayedProducts = products || [];

  if (!isSearching) {
    const inStock = displayedProducts.filter(product => parseInt(product.stock) > 0);
    const outOfStock = displayedProducts.filter(product => parseInt(product.stock) <= 0);
    displayedProducts = [...inStock, ...outOfStock].slice(0, 8);
  }

  if (loading) {
    return (
      <Container className="text-center my-5 py-5">
        <Spinner animation="border" variant="success" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="home-container p-0">
      
      {!isSearching && (
        <div className="home-hero mb-5">
          <div className="hero-content">
            <h2>FRESH GROCERIES ONLINE</h2>
            <Link to="/products">
              <button className="home-shop-btn">SHOP NOW</button>
            </Link>
          </div>
        </div>
      )}

      {!isSearching && (
        <section id="categories" className="category-section mb-5">
          <Container>
            <h2 className="home-section-title mb-4 text-start text-success fw-bold">
              Shop by Categories
            </h2>
            <Row className="g-2 justify-content-center">
              {(!categories || categories.length === 0) ? (
                 <p className="text-muted">No categories available.</p>
              ) : (
                 categories.map((cat) => (
                   <Col key={cat.id} xs={3} sm={3} md={3} lg={2}>
                     <CategoryCard category={cat} />
                   </Col>
                 ))
              )}
            </Row>
          </Container>
        </section>
      )}

      <section id="products" className="product-section mb-5">
        <Container>
          <h2 className="home-section-title mb-4 text-start text-success fw-bold">
            {isSearching ? `Search result for '${searchTerm}'` : "Featured Products"}
          </h2>
          
          {/* 'justify-content-center' keeps the grid balanced if TOTAL products < 8 */}
          <Row className="g-2 justify-content-center">
            {(!displayedProducts || displayedProducts.length === 0) ? (
               <div className="text-center py-5">
                 <p className="text-muted fs-5">
                   {isSearching 
                     ? `No products found matching '${searchTerm}'.` 
                     : "No featured products available."}
                 </p>
                 {isSearching && (
                   <Link to="/products" className="btn btn-outline-success mt-2">
                     View All Products
                   </Link>
                 )}
               </div>
            ) : (
               displayedProducts.map((product) => (
                 <Col key={product.id} xs={6} sm={6} md={4} lg={3}>
                   <ProductCard product={product} onAddToCart={onAddToCart} />
                 </Col>
               ))
            )}
          </Row>
          
          {!isSearching && products && products.length > 8 && (
             <div className="text-center mt-4">
                <Link to="/products">
                   <button className="btn btn-outline-success">View All Products</button>
                </Link>
             </div>
          )}
        </Container>
      </section>
    </Container>
  );
};

export default HomePage;