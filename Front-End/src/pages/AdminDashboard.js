import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner, Modal, Pagination } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { fetchProducts, fetchCategories, deleteProduct, updateProduct } from "../utils/api";
import "../Styles/OrderHistory.css"; 

function AdminDashboard({ token, showNotification }) {
    const navigate = useNavigate();

    // --- STATE ---
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Toggling State
    const [togglingId, setTogglingId] = useState(null);

    // Dashboard Stats
    const [stats, setStats] = useState({ total: 0, lowStock: 0, categories: 0 });

    // --- FETCH DATA ---
    useEffect(() => {
        loadData();
    }, [currentPage]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetchProducts(currentPage),
                fetchCategories()
            ]);

            if (prodRes.data) {
                setProducts(prodRes.data);
                setLastPage(prodRes.last_page);
                
                setStats({
                    total: prodRes.total || prodRes.data.length, 
                    lowStock: prodRes.data.filter(p => p.stock <= 10).length,
                    categories: catRes.length
                });
            }
            setCategories(catRes);
        } catch (error) {
            console.error("Failed to load data", error);
            if (showNotification) showNotification("Failed to load dashboard data.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleSearch = (e) => { 
        setSearchTerm(e.target.value.toLowerCase()); 
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.product_name.toLowerCase().includes(searchTerm);
        const categoryName = p.category ? p.category.category_name : 'Uncategorized';
        const matchesCategory = filterCategory === "" || categoryName === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Delete Handlers
    const handleDeleteClick = (product) => { 
        setProductToDelete(product); 
        setShowDeleteModal(true); 
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProduct(productToDelete.id);
            if (showNotification) showNotification(`Product "${productToDelete.product_name}" deleted successfully.`, "success");
            setShowDeleteModal(false);
            setProductToDelete(null);
            loadData(); 
        } catch (err) {
            if (showNotification) showNotification("Failed to delete product.", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    // Toggle Visibility Handler
    const handleToggleVisibility = async (product) => {
        setTogglingId(product.id);
        try {
            // FIX: Use 'is_active' (boolean) instead of 'is_visible'
            // The backend returns true/false for is_active.
            const newStatus = !product.is_active;

            // Send 'is_active' to backend (ProductController expects this or maps is_visible to it)
            await updateProduct(product.id, { is_active: newStatus });
            
            // Optimistic update
            setProducts(products.map(p => 
                p.id === product.id ? { ...p, is_active: newStatus } : p
            ));
            
            if (showNotification) showNotification(`Product ${newStatus ? 'enabled' : 'disabled'} successfully.`, "success");
        } catch (error) {
            if (showNotification) showNotification("Failed to update product status.", "error");
        } finally {
            setTogglingId(null);
        }
    };

    const getPrice = (price, discount) => {
        const p = parseFloat(price);
        const d = parseFloat(discount || 0);
        return p - (p * (d / 100));
    };

    if (loading && products.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
            </div>
        );
    }

    return (
        <div className="order-history-container" style={{ maxWidth: '1400px' }}>
            
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <h1 className="mb-0 border-0 p-0">Manage Products</h1>
                <div className="d-flex gap-2">
                    <Button 
                        variant="success" 
                        className="rounded-pill px-4 fw-bold shadow-sm" 
                        onClick={() => navigate("/admin/add")}
                    >
                        <i className="bi bi-plus-lg me-2"></i> Add Product
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <Row className="mb-4 g-3">
                <Col md={6}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#e8f5e9' }}>
                        <Card.Body className="text-center">
                            <h6 className="text-success text-uppercase fw-bold mb-1">Total Products</h6>
                            <h3 className="mb-0 fw-bold text-dark">{stats.total}</h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="border-0 shadow-sm" style={{ backgroundColor: '#fff3cd' }}>
                        <Card.Body className="text-center">
                            <h6 className="text-warning text-uppercase fw-bold mb-1" style={{ color: '#856404 !important' }}>Low Stock (≤10)</h6>
                            <h3 className="mb-0 fw-bold text-dark">{stats.lowStock}</h3>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters & Search Row */}
            <div className="mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div className="d-flex gap-2 overflow-auto" style={{ whiteSpace: 'nowrap', paddingBottom: '5px' }}>
                    <Button 
                        className="rounded-pill px-3 fw-medium shadow-sm"
                        style={{ 
                            backgroundColor: filterCategory === "" ? '#28a745' : 'white', 
                            color: filterCategory === "" ? 'white' : '#28a745',
                            border: '1px solid #28a745'
                        }}
                        onClick={() => setFilterCategory("")}
                    >
                        All Categories
                    </Button>
                    {categories.map(cat => (
                        <Button 
                            key={cat.id}
                            className="rounded-pill px-3 fw-medium shadow-sm"
                            style={{ 
                                backgroundColor: filterCategory === cat.category_name ? '#28a745' : 'white', 
                                color: filterCategory === cat.category_name ? 'white' : '#28a745',
                                border: '1px solid #28a745'
                            }}
                            onClick={() => setFilterCategory(cat.category_name)}
                        >
                            {cat.category_name}
                        </Button>
                    ))}
                </div>

                <div style={{ width: '300px' }}>
                    <InputGroup className="shadow-sm rounded-pill overflow-hidden bg-white border">
                        <InputGroup.Text className="bg-white border-0 ps-3">
                            <i className="bi bi-search text-success"></i>
                        </InputGroup.Text>
                        <Form.Control 
                            placeholder="Search products..." 
                            className="border-0 shadow-none bg-transparent"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </InputGroup>
                </div>
            </div>

            {/* Product Table */}
            <div className="rounded-4 overflow-hidden shadow-sm border" style={{ backgroundColor: 'white' }}>
                <Table responsive hover className="mb-0 text-center align-middle">
                    <thead className="text-white" style={{ backgroundColor: '#28a745' }}>
                        <tr>
                            <th className="py-3 border-0">Image</th>
                            <th className="py-3 border-0">Name</th>
                            <th className="py-3 border-0">Category</th>
                            <th className="py-3 border-0">Price</th>
                            <th className="py-3 border-0">Stock</th>
                            <th className="py-3 border-0">Status</th>
                            <th className="py-3 border-0">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-5 text-muted">No products found.</td></tr>
                        ) : (
                            filteredProducts.map((p, index) => (
                                <tr key={p.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                                    <td className="py-3">
                                        <div className="rounded mx-auto d-flex align-items-center justify-content-center overflow-hidden border" style={{width: '50px', height: '50px', backgroundColor: '#fff'}}>
                                            {p.image_url ? (
                                                <img src={p.image_url} alt="" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                                            ) : (
                                                <i className="bi bi-image text-muted"></i>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 fw-bold text-dark text-start">{p.product_name}</td>
                                    <td className="py-3"><Badge bg="light" text="dark" className="border">{p.category ? p.category.category_name : 'Uncategorized'}</Badge></td>
                                    <td className="py-3">
                                        {p.discount > 0 ? (
                                            <div>
                                                <small className="text-decoration-line-through text-muted d-block">₱{parseFloat(p.price).toFixed(2)}</small>
                                                <span className="fw-bold text-success">₱{getPrice(p.price, p.discount).toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <span className="fw-bold">₱{parseFloat(p.price).toFixed(2)}</span>
                                        )}
                                    </td>
                                    <td className="py-3">
                                        <Badge bg={p.stock <= 10 ? 'warning' : 'secondary'} className={p.stock <= 10 ? 'text-dark' : ''}>
                                            {p.stock}
                                        </Badge>
                                    </td>
                                    <td className="py-3">
                                        {/* Status / Visibility Toggle - UPDATED to use is_active */}
                                        <Button 
                                            variant={!p.is_active ? "outline-secondary" : "outline-success"}
                                            size="sm"
                                            className="rounded-pill py-0 px-2"
                                            onClick={() => handleToggleVisibility(p)}
                                            disabled={togglingId === p.id}
                                            style={{ fontSize: '0.75rem', minWidth: '80px' }}
                                        >
                                            {togglingId === p.id ? <Spinner size="sm" /> : (!p.is_active ? 'Disabled' : 'Active')}
                                        </Button>
                                    </td>
                                    <td className="py-3">
                                        <div className="d-flex justify-content-center gap-2">
                                            <Button 
                                                variant="link" 
                                                className="text-success p-0 fw-bold text-decoration-none" 
                                                onClick={() => navigate(`/admin/edit/${p.id}`)}
                                            >
                                                Edit
                                            </Button>
                                            <span className="text-muted">|</span>
                                            <Button 
                                                variant="link" 
                                                className="text-danger p-0 fw-bold text-decoration-none" 
                                                onClick={() => handleDeleteClick(p)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {lastPage > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                        {[...Array(lastPage)].map((_, idx) => (
                            <Pagination.Item 
                                key={idx + 1} 
                                active={idx + 1 === currentPage}
                                onClick={() => setCurrentPage(idx + 1)}
                            >
                                {idx + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} disabled={currentPage === lastPage} />
                    </Pagination>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => !isDeleting && setShowDeleteModal(false)} centered>
                <Modal.Header closeButton={!isDeleting} className="bg-danger text-white">
                    <Modal.Title><i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete <strong>{productToDelete?.product_name}</strong>?</p>
                    <p className="text-danger small mb-0">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                        {isDeleting ? <Spinner size="sm" animation="border" /> : 'Delete Product'}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
}

export default AdminDashboard;