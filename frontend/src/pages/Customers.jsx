import React, { useEffect, useState } from 'react'
import {
  getCustomers,
  createCustomer,
  deleteCustomer,
  getErrorMessage,
} from '../api/client'
import Alert from '../components/Alert.jsx'
import Modal from '../components/Modal.jsx'

const emptyForm = { full_name: '', email: '', phone: '' }

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await getCustomers()
      setCustomers(res.data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const openCreateModal = () => {
    setForm(emptyForm)
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    if (!form.email.trim()) {
      errs.email = 'Email is required'
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = 'Enter a valid email address'
    }
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }

    try {
      await createCustomer(payload)
      setSuccess('Customer created successfully')
      setShowModal(false)
      setError('')
      await fetchCustomers()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete customer "${customer.full_name}"? This cannot be undone.`)) return
    try {
      await deleteCustomer(customer.id)
      setSuccess('Customer deleted successfully')
      setError('')
      await fetchCustomers()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      <Alert type="success" message={success} onClose={() => setSuccess('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="toolbar">
        <span />
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add Customer
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading customers...</p>
        ) : customers.length === 0 ? (
          <p className="empty-state">No customers yet. Add your first customer.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>
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
        <Modal title="Add Customer" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
              {formErrors.full_name && <div className="form-error">{formErrors.full_name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {formErrors.email && <div className="form-error">{formErrors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
