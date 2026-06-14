import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder, getCustomer, getProducts, getErrorMessage } from '../api/client'
import Alert from '../components/Alert.jsx'

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const orderRes = await getOrder(id)
        setOrder(orderRes.data)

        const [customerRes, productsRes] = await Promise.all([
          getCustomer(orderRes.data.customer_id),
          getProducts(),
        ])
        setCustomer(customerRes.data)
        setProducts(productsRes.data)
        setError('')
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  return (
    <div>
      <h1 className="page-title">Order Details</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />

      <Link to="/orders" className="btn btn-secondary btn-sm" style={{ marginBottom: 16, display: 'inline-block' }}>
        ← Back to Orders
      </Link>

      {loading ? (
        <p>Loading order...</p>
      ) : order ? (
        <>
          <div className="card">
            <h2 className="section-title">Order #{order.id}</h2>
            <p><strong>Customer:</strong> {customer ? `${customer.full_name} (${customer.email})` : `#${order.customer_id}`}</p>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
            <p><strong>Total Amount:</strong> ${order.total_amount.toFixed(2)}</p>
          </div>

          <div className="card">
            <h2 className="section-title">Items</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{productMap[item.product_id]?.name || `Product #${item.product_id}`}</td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>${(item.unit_price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="empty-state">Order not found.</p>
      )}
    </div>
  )
}
