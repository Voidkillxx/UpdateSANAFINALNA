import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import CategoryFilter from '../components/CategoryFilter';
import '../Styles/ProductList.css';

const ProductList = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  currentPage,
  lastPage,
  setCurrentPage,
  loading
}) => {
  // FIX: Destructure setSearchParams to update URL
  const [searchParams, setSearchParams] = useSearchParams();

  // FIX: Sync URL -> State (Initial Load & Back/Forward Browser Navigation)
  // Removed 'selectedCategory' from dependencies to prevent the "Revert" bug.
  // Now this only runs if the URL actually changes or categories load.
  useEffect(() => {
    const categoryParam = searchParams.get('category');

    if (categories.length > 0) {
      if (categoryParam) {
        // 1. Try to match by ID
        let foundCategory = categories.find(c => c.id === parseInt(categoryParam));

        // 2. If not found, match by Slug
        if (!foundCategory) {
          foundCategory = categories.find(c => c.slug === categoryParam);
        }

        // 3. Sync State with URL
        if (foundCategory && selectedCategory !== foundCategory.id) {
           onSelectCategory(foundCategory.id);
        }
      } else {
        // If URL has no category, but state does (e.g. user cleared it via URL), reset state
        if (selectedCategory !== null) {
           onSelectCategory(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categories, onSelectCategory]); 

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, setCurrentPage]);

  // FIX: New handler to update URL when User clicks a button
  const handleCategoryChange = (categoryId) => {
    // 1. Create new params based on current ones (preserves other params if needed)
    const newParams = new URLSearchParams(searchParams);

    if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        // Update URL with Slug
        newParams.set('category', category.slug);
        // Reset to page 1 in URL as well for clean navigation
        newParams.set('page', 1);
      }
    } else {
      // If "All" is selected (null), remove category param
      newParams.delete('category');
      newParams.set('page', 1);
    }

    // 2. Apply URL update
    setSearchParams(newParams);

    // 3. Update State (Optional: The useEffect above would catch this, 
    // but calling it directly makes the UI feel snappier)
    onSelectCategory(categoryId);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Optional: Keep page in URL sync
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', pageNumber);
    setSearchParams(newParams);
  };

  return (
    <Container className="my-5">
      <div className="product-list-container">
        <h3 className="product-list-title">All Products</h3>
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategoryChange} 
        />
        {/* ^ FIX: Passed the new handler instead of the raw prop */}
        
        {loading ? (
           <div className="text-center py-5">
              <Spinner animation="border" variant="success" />
              <p className="mt-2 text-muted">Loading products...</p>
           </div>
        ) : (
           <>
             <Row className="g-2 mt-3">
               {(products || []).map(product => (
                   <Col key={product.id} xs={6} sm={4} md={3} lg={3}>
                   <ProductCard product={product} onAddToCart={onAddToCart} />
                   </Col>
               ))}
               {(!products || products.length === 0) && (
                   <div className="col-12 text-center py-5 text-muted">
                       <h5>No products found.</h5>
                   </div>
               )}
             </Row>
             
             {lastPage > 1 && (
                 <Pagination 
                   itemsPerPage={1} 
                   totalItems={lastPage} 
                   currentPage={currentPage} 
                   paginate={paginate} 
                 />
             )}
           </>
        )}
      </div>
    </Container>
  );
};

export default ProductList;