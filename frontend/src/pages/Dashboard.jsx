import React, { useEffect, useState } from 'react'
import { getDashboard, getErrorMessage } from '../api/client'
import Alert from '../components/Alert.jsx'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await getDashboard()
      setSummary(res.data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />

      {loading && <p>Loading dashboard...</p>}

      {summary && (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="value">{summary.total_products}</div>
              <div className="label">Total Products</div>
            </div>
            <div className="summary-card">
              <div className="value">{summary.total_customers}</div>
              <div className="label">Total Customers</div>
            </div>
            <div className="summary-card">
              <div className="value">{summary.total_orders}</div>
              <div className="label">Total Orders</div>
            </div>
            <div className="summary-card">
              <div className="value">{summary.low_stock_products.length}</div>
              <div className="label">Low Stock Products</div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Low Stock Products (≤ 10 units)</h2>
            {summary.low_stock_products.length === 0 ? (
              <p className="empty-state">All products are well stocked.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Price</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.low_stock_products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.sku}</td>
                        <td>${p.price.toFixed(2)}</td>
                        <td>
                          <span className="badge badge-low">{p.quantity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
