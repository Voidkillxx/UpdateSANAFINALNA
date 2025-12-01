import React from 'react';
import { Button } from 'react-bootstrap';
import '../Styles/CategoryFilter.css'; 

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-filter-container mb-4">
      {/* "All" Button */}
      <Button
        variant={!selectedCategory ? 'success' : 'outline-success'}
        onClick={() => onSelectCategory(null)}
        className="category-button"
      >
        All
      </Button>

      {/* Category List */}
      {(categories || []).map(category => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'success' : 'outline-success'}
          onClick={() => onSelectCategory(category.id)}
          className="category-button"
        >
          {/* FIX: Use 'category_name' from DB, fallback to 'name' */}
          {category.category_name || category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;