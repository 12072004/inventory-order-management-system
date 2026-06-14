import React, { useEffect, useState } from 'react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getErrorMessage,
} from '../api/client'
import Alert from '../components/Alert.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = { name: '', sku: '', price: '', quantity: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await getProducts()
      setProducts(res.data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const openCreateModal = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity: String(product.quantity),
    })
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!form.sku.trim()) errs.sku = 'SKU/code is required'
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) {
      errs.price = 'Price must be a non-negative number'
    }
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0 || !Number.isInteger(Number(form.quantity))) {
      errs.quantity = 'Quantity must be a non-negative whole number'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        setSuccess('Product updated successfully')
      } else {
        await createProduct(payload)
        setSuccess('Product created successfully')
      }
      setShowModal(false)
      setError('')
      await fetchProducts()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return
    try {
      await deleteProduct(product.id)
      setSuccess('Product deleted successfully')
      setError('')
      await fetchProducts()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="page-title">Products</h1>
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="toolbar">
        <span />
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add Product
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p className="empty-state">No products yet. Add your first product.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td>
                      {p.quantity <= 10 ? (
                        <span className="badge badge-low">Low Stock</span>
                      ) : (
                        <span className="badge badge-ok">In Stock</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)} style={{ marginRight: 6 }}>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>
                        Delete
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
        <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU / Code</label>
              <input
                id="sku"
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              {formErrors.price && <div className="form-error">{formErrors.price}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity in Stock</label>
              <input
                id="quantity"
                type="number"
                step="1"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
