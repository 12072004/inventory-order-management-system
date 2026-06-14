import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getOrders,
  getCustomers,
  getProducts,
  createOrder,
  deleteOrder,
  getErrorMessage,
} from '../api/client'
import Alert from '../components/Alert.jsx'
import Modal from '../components/Modal.jsx'

const emptyItem = () => ({ product_id: '', quantity: '1' })

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        getOrders(),
        getCustomers(),
        getProducts(),
      ])
      setOrders(ordersRes.data)
      setCustomers(customersRes.data)
      setProducts(productsRes.data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))

  const openCreateModal = () => {
    setCustomerId('')
    setItems([emptyItem()])
    setFormErrors({})
    setShowModal(true)
  }

  const addItemRow = () => setItems([...items, emptyItem()])

  const removeItemRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    const next = [...items]
    next[index] = { ...next[index], [field]: value }
    setItems(next)
  }

  const validate = () => {
    const errs = {}
    if (!customerId) errs.customer = 'Please select a customer'

    const itemErrors = []
    items.forEach((item, idx) => {
      const itemErr = {}
      if (!item.product_id) itemErr.product_id = 'Select a product'
      if (!item.quantity || isNaN(item.quantity) || Number(item.quantity) <= 0 || !Number.isInteger(Number(item.quantity))) {
        itemErr.quantity = 'Enter a valid quantity'
      } else if (item.product_id) {
        const product = productMap[item.product_id]
        if (product && Number(item.quantity) > product.quantity) {
          itemErr.quantity = `Only ${product.quantity} in stock`
        }
      }
      if (Object.keys(itemErr).length > 0) itemErrors[idx] = itemErr
    })
    if (itemErrors.length > 0) errs.items = itemErrors

    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = productMap[item.product_id]
      const qty = Number(item.quantity) || 0
      if (!product) return sum
      return sum + product.price * qty
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const payload = {
      customer_id: Number(customerId),
      items: items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      })),
    }

    try {
      await createOrder(payload)
      setSuccess('Order created successfully')
      setShowModal(false)
      setError('')
      await fetchAll()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (order) => {
    if (!window.confirm(`Cancel order #${order.id}? Stock will be restored.`)) return
    try {
      await deleteOrder(order.id)
      setSuccess('Order cancelled successfully')
      setError('')
      await fetchAll()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="page-title">Orders</h1>
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="toolbar">
        <span />
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          disabled={customers.length === 0 || products.length === 0}
          title={customers.length === 0 || products.length === 0 ? 'Add at least one customer and one product first' : ''}
        >
          + Create Order
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="empty-state">No orders yet. Create your first order.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{customerMap[o.customer_id]?.full_name || `Customer #${o.customer_id}`}</td>
                    <td>{o.items.length}</td>
                    <td>${o.total_amount.toFixed(2)}</td>
                    <td>{new Date(o.created_at).toLocaleString()}</td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-sm" style={{ marginRight: 6 }}>
                        View
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o)}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="Create Order" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">-- Select customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
              {formErrors.customer && <div className="form-error">{formErrors.customer}</div>}
            </div>

            <label>Order Items</label>
            <div className="order-items-list" style={{ marginTop: 8, marginBottom: 8 }}>
              {items.map((item, idx) => (
                <div key={idx}>
                  <div className="order-item-row">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">-- Select product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price.toFixed(2)}, stock: {p.quantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeItemRow(idx)}
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                  {formErrors.items && formErrors.items[idx] && (
                    <div className="form-error">
                      {formErrors.items[idx].product_id || formErrors.items[idx].quantity}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={addItemRow}>
              + Add Item
            </button>

            <div className="card" style={{ marginTop: 16, marginBottom: 0, padding: 12 }}>
              <strong>Estimated Total: ${calculateTotal().toFixed(2)}</strong>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Placing order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
