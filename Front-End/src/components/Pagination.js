import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

const Pagination = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
  const pageNumbers = [];
  // Calculate total pages based on DB total count
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Hide pagination if there is only 1 page
  if (totalPages <= 1) {
    return null; 
  }

  return (
    <div className="d-flex justify-content-center mt-4">
      <BootstrapPagination>
        <BootstrapPagination.First 
          onClick={() => paginate(1)} 
          disabled={currentPage === 1}
        />
        <BootstrapPagination.Prev 
          onClick={() => paginate(currentPage - 1)} 
          disabled={currentPage === 1}
        />
        
        {pageNumbers.map(number => (
          <BootstrapPagination.Item
            key={number}
            active={number === currentPage}
            onClick={() => paginate(number)}
          >
            {number}
          </BootstrapPagination.Item>
        ))}
        
        <BootstrapPagination.Next 
          onClick={() => paginate(currentPage + 1)} 
          disabled={currentPage === totalPages}
        />
        <BootstrapPagination.Last 
          onClick={() => paginate(totalPages)} 
          disabled={currentPage === totalPages}
        />
      </BootstrapPagination>
    </div>
  );
};

export default Pagination;