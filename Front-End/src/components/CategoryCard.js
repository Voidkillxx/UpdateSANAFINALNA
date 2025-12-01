import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../Styles/CategoryCard.css'; 

const CategoryCard = ({ category }) => {
  // Use correct field names from Laravel DB
  // Fallback to 'name' and 'imageUrl' if older format passed
  const name = category.category_name || category.name;
  const image = category.image_url || category.imageUrl;

  return (
    <Card className="category-card">
      {/* Use the slug if available, otherwise ID */}
      <Link to={`/products?category=${category.slug || category.id}`} className="category-card-link">
        <Card.Img
          variant="top"
          src={image || '/img/placeholder.png'} 
          alt={name}
          className="category-card-image"
          // Add error handling for broken images
          onError={(e) => { e.target.onerror = null; e.target.src = '/img/placeholder.png'; }}
        />
        <Card.Body className="category-card-body">
          <Card.Title className="category-card-title">{name}</Card.Title>
          <div className="category-card-browse">
            Browse →
          </div>
        </Card.Body>
      </Link>
    </Card> 
  );
};

export default CategoryCard;