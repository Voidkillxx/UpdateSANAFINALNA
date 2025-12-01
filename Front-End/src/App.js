import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Alert, Container, Spinner, Modal } from 'react-bootstrap'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import { CartProvider, CartContext } from './context/CartContext';

// Components & Pages
import AppNavbar from './components/Navbar'; 
import AddQuantityModal from './components/AddQuantityModal';
import HomePage from './pages/HomePage';
import ProductList from './pages/ProductList';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import LoginPage from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import EditProduct from './pages/EditProduct';
import AddProduct from './pages/AddProduct';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import OrderHistory from './pages/OrderHistory'; 
// --- NEW IMPORTS ---
import ManageOrders from './pages/ManageOrders';
import ManageUsers from './pages/ManageUsers';

let alertTimeoutId = null;

// --- INTERNAL COMPONENTS: Confirmation Dialog ---
const ConfirmationDialog = ({ show, onHide, onConfirm, title, message }) => {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{message}</p>
            </Modal.Body>
            <Modal.Footer>
                <button className="btn btn-secondary" onClick={onHide}>No, Keep It</button>
                <button className="btn btn-danger" onClick={onConfirm}>Yes, Confirm</button>
            </Modal.Footer>
        </Modal>
    );
};

// --- INTERNAL COMPONENTS: Cart Modal ---
const CartModal = ({ show, onClose, cartItems, onUpdateQty, onRemove, onCheckout, loading }) => {
    if (!show) return null;
    const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055}}> 
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-success text-white"> 
                        <h5 className="modal-title"><i className="bi bi-cart"></i> Your Shopping Cart</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h4>Your cart is empty.</h4>
                                <p>Start shopping to fill it up!</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {cartItems.map(item => (
                                            <tr key={item.id}>
                                                <td>
                                                   <div className="d-flex align-items-center">
                                                       <img src={item.product.image_url || 'https://via.placeholder.com/40'} alt="" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'5px', marginRight:'10px'}}/>
                                                       <div><div className="fw-bold">{item.product.product_name}</div><small className="text-muted">{item.product.description?.substring(0, 30)}...</small></div>
                                                   </div>
                                                </td>
                                                <td>${item.product.price.toFixed(2)}</td>
                                                <td>
                                                    <div className="input-group input-group-sm" style={{width: '100px'}}>
                                                        <button className="btn btn-outline-secondary" onClick={() => onUpdateQty(item.id, item.quantity - 1)} disabled={loading || item.quantity <= 1}>-</button>
                                                        <input type="text" className="form-control text-center" value={item.quantity} readOnly />
                                                        <button className="btn btn-outline-secondary" onClick={() => onUpdateQty(item.id, item.quantity + 1)} disabled={loading}>+</button>
                                                    </div>
                                                </td>
                                                <td className="fw-bold text-success">${(item.product.price * item.quantity).toFixed(2)}</td>
                                                <td><button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(item.id)} disabled={loading}><i className="bi bi-x-lg"></i></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer justify-content-between">
                        <div className="h5 mb-0">Total: <span className="text-success fw-bold">${total.toFixed(2)}</span></div>
                        <div>
                            <button className="btn btn-secondary me-2" onClick={onClose}>Continue Shopping</button>
                            {cartItems.length > 0 && <button className="btn btn-success" onClick={onCheckout}>Proceed to Checkout</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- INTERNAL COMPONENTS: Checkout Modal ---
const CheckoutModal = ({ show, onClose, onConfirm, loading, cartItems }) => {
    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('Cash On Delivery');
    if(!show) return null;
    
    const selectedItemIds = cartItems ? cartItems.map(item => item.id) : [];
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        onConfirm({ 
            shipping_address: address, 
            payment_type: payment, 
            selected_items: selectedItemIds 
        }); 
    };
    
    return (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title"><i className="bi bi-box"></i> Checkout</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3"><label className="form-label">Shipping Address</label><textarea className="form-control" rows="3" required value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address..."></textarea></div>
                            <div className="mb-4"><label className="form-label">Payment Method</label><select className="form-select" value={payment} onChange={e => setPayment(e.target.value)}><option value="Cash On Delivery">Cash On Delivery</option><option value="Card">Card (Mock)</option></select></div>
                            <div className="d-grid"><button className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Placing Order...' : 'Place Order'}</button></div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

function AppContent() {
    const {  setUser, refreshCart } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [cartItems, setCartItems] = useState([]); 
    const [cartCount, setCartCount] = useState(0);
    const [showAddQtyModal, setShowAddQtyModal] = useState(false);
    const [productToAdd, setProductToAdd] = useState(null);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: '', variant: 'success' });
    const navigate = useNavigate();
    const location = useLocation();
    const isLoginPage = ['/login', '/forgot', '/reset', '/register'].includes(location.pathname);

    // --- RE-ADDED: Removal Modal States ---
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false); 
    const [itemToRemoveId, setItemToRemoveId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const catRes = await fetch('http://localhost:8095/api/categories');
                const catData = await catRes.json();
                setCategories(catData);

                let url = `http://localhost:8095/api/products?page=${currentPage}`;
                
                if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
                
                if (selectedCategory) {
                    const catObj = catData.find(c => c.id === parseInt(selectedCategory));
                    if(catObj) url += `&category=${catObj.slug}`;
                }

                const prodRes = await fetch(url);
                const prodData = await prodRes.json();

                if (prodData.data) {
                    setProducts(prodData.data);
                    setLastPage(prodData.last_page);
                } else {
                    setProducts(prodData);
                    setLastPage(1);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [currentPage, searchTerm, selectedCategory]);

    useEffect(() => {
        if (currentUser && typeof setUser === 'function') {
            setUser(currentUser.id);
            fetchCart(localStorage.getItem('token'));
        }
        return () => { if (alertTimeoutId) clearTimeout(alertTimeoutId); };
    }, [currentUser, setUser]); 

    const fetchCart = async (token) => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:8095/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(res.ok) {
                const data = await res.json();
                if(data.cart_items) {
                    setCartItems(data.cart_items);
                    setCartCount(data.cart_items.reduce((acc, item) => acc + item.quantity, 0));
                }
            } else {
                 setCartItems([]);
                 setCartCount(0);
            }
        } catch(e) { console.error(e); }
    };

    const showAlert = (message, variant = 'success', duration = 3000) => {
        if (alertTimeoutId) clearTimeout(alertTimeoutId);
        setAlertInfo({ show: true, message, variant });
        alertTimeoutId = setTimeout(() => {
            setAlertInfo({ show: false, message: '', variant: 'success' });
        }, duration);
    };

    const handleLogin = (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        if (typeof setUser === 'function') setUser(user.id);
        
        fetchCart(token);
        refreshCart(); 

        showAlert(`Welcome back, ${user.first_name}!`, 'success');
        navigate(user.is_admin ? '/admin' : '/');
    };

    const handleLogout = () => {
        localStorage.clear();
        setCurrentUser(null);
        setCartItems([]);
        setCartCount(0);
        
        if (typeof setUser === 'function') setUser(null);
        if (typeof refreshCart === 'function') refreshCart(); 
        
        showAlert('You have been logged out.', 'info');
        navigate('/');
    };

    const handleResetFilters = () => {
        setSelectedCategory(null);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleOpenCart = () => {
        if (!currentUser) {
            showAlert("Please login to view your cart!", "warning");
            return;
        }
        setShowCart(true);
    };

    const handleShowAddQuantityModal = async (product) => {
        if (!currentUser) {
            showAlert('Please log in to add items to your cart.', 'warning');
            return false;
        }
        
        setLoading(true);
        let freshProduct;
        try {
            const res = await fetch(`http://localhost:8095/api/products/${product.id}`);
            const data = await res.json();
            freshProduct = data;
        } catch (e) {
            showAlert('Could not load product details.', 'danger');
            setLoading(false);
            return false;
        } finally {
            setLoading(false);
        }
        
        if (!freshProduct || freshProduct.stock <= 0) {
            showAlert(`${freshProduct?.product_name || 'Item'} is out of stock.`, 'danger');
            return false;
        }
        
        setProductToAdd(freshProduct);
        setShowAddQtyModal(true);
        return true;
    };

    const handleCloseAddQuantityModal = () => {
        setProductToAdd(null);
        setShowAddQtyModal(false);
    };

    const handleConfirmAddToCart = async (product, quantity) => {
         setLoading(true);
         try {
             const token = localStorage.getItem('token');
             const res = await fetch('http://localhost:8095/api/cart/items', {
                 method: 'POST',
                 headers: { 
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${token}` 
                 },
                 body: JSON.stringify({ product_id: product.id, quantity: quantity })
             });
             if(res.ok) {
                 showAlert('Added to cart!', 'success');
                 fetchCart(token);
                 refreshCart(); 
             } else {
                const errorData = await res.json();
                 showAlert(errorData.message || 'Failed to add item', 'danger');
             }
         } catch(e) { showAlert('Error connecting to server', 'danger'); }
         setLoading(false);
    };

    const updateQty = async (itemId, newQty) => {
        if(newQty < 1) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8095/api/cart/items/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ quantity: newQty })
            });
            if(res.ok) {
                 fetchCart(token);
                 refreshCart();
            } else {
                const errorData = await res.json();
                showAlert(errorData.message || 'Failed to update quantity', 'danger');
            }
        } catch(e) {
            showAlert('Error updating cart', 'danger');
        }
        setLoading(false);
    };

    // Handler to open the confirmation modal instead of window.confirm
    // eslint-disable-next-line no-unused-vars
    const handleRemoveClick = (itemId) => {
        setItemToRemoveId(itemId);
        setShowRemoveConfirm(true);
    }

    const removeFromCart = async (itemId) => {
        setShowRemoveConfirm(false);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:8095/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCart(token);
            refreshCart();
        } catch(e) {}
        setLoading(false);
    };

    const handleCheckout = async (details) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:8095/api/checkout`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(details)
            });
            const data = await res.json();
            if(res.ok) {
                alert(`Order Successful! Order ID: ${data.order_id}`);
                setShowCheckout(false);
                setShowCart(false);
                fetchCart(token);
                refreshCart();
            } else {
                alert(data.message || 'Checkout failed');
            }
        } catch(e) { alert('Error processing checkout'); }
        setLoading(false);
    };

    return (
        <div className="App">
            {loading && <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center" style={{zIndex: 10000}}><Spinner animation="border" variant="light" /></div>}
            {alertInfo.show && <Alert variant={alertInfo.variant} onClose={() => setAlertInfo({ ...alertInfo, show: false })} dismissible className="app-alert position-fixed top-0 start-50 translate-middle-x mt-3 shadow" style={{ zIndex: 9999, width: 'auto', top: '70px' }}>{alertInfo.message}</Alert>}

            {!isLoginPage && <AppNavbar currentUser={currentUser} handleLogout={handleLogout} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleResetFilters={handleResetFilters} showAlert={showAlert} cartCount={cartCount} onOpenCart={handleOpenCart} />}

            <Container fluid className="main-content py-3">
                <Routes>
                    <Route path="/" element={<HomePage products={products} categories={categories} onAddToCart={handleShowAddQuantityModal} loading={loadingData} searchTerm={searchTerm} />} />
                    <Route path="/product/:slug" element={<ProductDetails onAddToCart={handleShowAddQuantityModal} />} />
                    <Route path="/products" element={<ProductList products={products} categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} onAddToCart={handleShowAddQuantityModal} currentPage={currentPage} lastPage={lastPage} setCurrentPage={setCurrentPage} loading={loadingData} />} />
                    <Route path="/cart" element={<Cart showAlert={showAlert} />} />
                    <Route path="/checkout" element={<Checkout showAlert={showAlert} handleResetFilters={handleResetFilters} />} />
                    <Route path="/login" element={<LoginPage handleLogin={handleLogin} />} />
                    <Route path="/register" element={<Register onLogin={handleLogin} />} /> 
                    <Route path="/forgot" element={<ForgotPassword />} />
                    <Route path="/reset" element={<ResetPassword />} />
                    <Route path="/profile" element={<ProfilePage showAlert={showAlert} />} />
                    <Route path="/orders" element={<OrderHistory showAlert={showAlert} />} />

                    {/* --- ADMIN ROUTES --- */}
                    <Route path="/admin" element={<AdminDashboard token={localStorage.getItem('token')} />} />
                    <Route path="/admin/edit/:productId" element={<EditProduct />} />
                    <Route path="/admin/add" element={<AddProduct />} />
                    
                    {/* NEW ADMIN PAGES */}
                    <Route path="/admin/orders" element={<ManageOrders showAlert={showAlert} />} />
                    <Route path="/admin/users" element={<ManageUsers showAlert={showAlert} />} />
                    
                </Routes>
            </Container>

            <AddQuantityModal show={showAddQtyModal} handleClose={handleCloseAddQuantityModal} product={productToAdd} handleAdd={handleConfirmAddToCart} />
            <CartModal show={showCart} onClose={() => setShowCart(false)} cartItems={cartItems} onUpdateQty={updateQty} onRemove={removeFromCart} onCheckout={() => setShowCheckout(true)} loading={loading} />
            <CheckoutModal show={showCheckout} onClose={() => setShowCheckout(false)} onConfirm={handleCheckout} loading={loading} cartItems={cartItems}/>
        </div>
    );
}

function App() { return <CartProvider><Router><AppContent /></Router></CartProvider>; }
export default App;