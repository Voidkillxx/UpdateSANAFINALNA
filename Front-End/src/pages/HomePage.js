import React from "react"; 
import { Link } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import ProductCard from "../components/ProductCard";
import CategoryCard from "../components/CategoryCard"; 
import "../Styles/HomePage.css";

const HomePage = ({ products, categories, onAddToCart, loading, searchTerm }) => {

  // Logic: If a search term exists, consider it "Searching"
  // Ensure searchTerm is a string before checking length to prevent crashes
  const isSearching = searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0;

  // Logic: If searching, show ALL filtered products. 
  // If not searching, only show the first 8 as "Featured".
  const displayedProducts = isSearching ? products : (products || []).slice(0, 8);

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
      
      {/* 1. HERO SECTION - Only show if NOT searching */}
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

      {/* 2. CATEGORY SECTION - Only show if NOT searching */}
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

      {/* 3. PRODUCT SECTION - Changes based on search state */}
      <section id="products" className="product-section mb-5">
        <Container>
          {/* Dynamic Title - UPDATED: Exact format "Search result for 'term'" */}
          <h2 className="home-section-title mb-4 text-start text-success fw-bold">
            {isSearching ? `Search result for '${searchTerm}'` : "Featured Products"}
          </h2>
          
          <Row className="g-2">
            {(!displayedProducts || displayedProducts.length === 0) ? (
               // Message if no products found
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
               // Display Products (All if searching, limited if featured)
               displayedProducts.map((product) => (
                 <Col key={product.id} xs={3} sm={3} md={3} lg={3}>
                   <ProductCard product={product} onAddToCart={onAddToCart} />
                 </Col>
               ))
            )}
          </Row>
          
          {/* Show "View All" button ONLY if NOT searching */}
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