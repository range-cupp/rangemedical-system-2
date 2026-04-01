// pages/admin/shop-orders.js — Admin view for vial shop orders
import AdminLayout, { sharedStyles } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { Package, Truck, MapPin, Search, ChevronDown } from 'lucide-react';

const STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  paid: { bg: '#dbeafe', color: '#1e40af' },
  shipped: { bg: '#e0e7ff', color: '#3730a3' },
  delivered: { bg: '#d1fae5', color: '#065f46' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function ShopOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/shop-orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  const updateOrder = async (orderId, updates) => {
    setUpdating(orderId);
    await fetch('/api/admin/shop-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...updates }),
    });
    await fetchOrders();
    setUpdating(null);
    setTrackingInput('');
  };

  const filteredOrders = filter
    ? orders.filter(o => {
        const name = o.patients?.name?.toLowerCase() || '';
        const num = o.order_number?.toLowerCase() || '';
        const q = filter.toLowerCase();
        return name.includes(q) || num.includes(q);
      })
    : orders;

  return (
    <AdminLayout title="Shop Orders">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ ...sharedStyles.input, paddingLeft: 32, width: 240 }}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...sharedStyles.input, width: 160 }}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading orders...</p>
      ) : filteredOrders.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: 40 }}>No orders found</p>
      ) : (
        <div>
          {filteredOrders.map(order => {
            const isExpanded = expandedOrder === order.id;
            const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            const isPickup = order.shipping_method?.startsWith('pickup');
            const items = order.items || [];
            const totalVials = items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div key={order.id} style={{ ...sharedStyles.card, marginBottom: 12 }}>
                <div
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{order.order_number}</span>
                      <span style={{ fontSize: 13, color: '#666', marginLeft: 12 }}>{order.patients?.name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>{totalVials} vial{totalVials !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>${(order.total_cents / 100).toFixed(2)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', background: sc.bg, color: sc.color }}>{STATUS_LABELS[order.status]}</span>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#999' }}>
                      {isPickup ? <MapPin size={14} /> : <Truck size={14} />}
                    </span>
                    <ChevronDown size={16} style={{ color: '#999', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 14 }}>
                      {/* Items */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', margin: '0 0 8px' }}>Items</p>
                        {items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                            <span>{item.quantity}x {item.name}</span>
                            <span style={{ color: '#666' }}>${(item.total_cents / 100).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span>Shipping</span>
                          <span style={{ color: '#666' }}>{order.shipping_cents > 0 ? `$${(order.shipping_cents / 100).toFixed(2)}` : 'Free'}</span>
                        </div>
                      </div>

                      {/* Shipping / Pickup */}
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#999', margin: '0 0 8px' }}>
                          {isPickup ? 'Pickup' : 'Ship To'}
                        </p>
                        {isPickup ? (
                          <p style={{ fontSize: 13, margin: 0 }}>{order.shipping_method === 'pickup_nb' ? 'Newport Beach' : 'San Clemente'}</p>
                        ) : order.shipping_address ? (
                          <>
                            <p style={{ fontSize: 13, margin: 0 }}>{order.shipping_address.name}</p>
                            <p style={{ fontSize: 13, margin: 0 }}>{order.shipping_address.street}{order.shipping_address.street2 ? `, ${order.shipping_address.street2}` : ''}</p>
                            <p style={{ fontSize: 13, margin: 0 }}>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                          </>
                        ) : null}

                        {order.tracking_number && (
                          <p style={{ fontSize: 13, marginTop: 8 }}><strong>Tracking:</strong> {order.tracking_number}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 14, paddingTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                      {order.status === 'paid' && !isPickup && (
                        <>
                          <input
                            type="text"
                            placeholder="Tracking number"
                            value={trackingInput}
                            onChange={e => setTrackingInput(e.target.value)}
                            style={{ ...sharedStyles.input, width: 200, fontSize: 13 }}
                          />
                          <button
                            onClick={() => updateOrder(order.id, { status: 'shipped', trackingNumber: trackingInput })}
                            disabled={!trackingInput || updating === order.id}
                            style={{ ...sharedStyles.button, fontSize: 13, padding: '6px 14px', opacity: !trackingInput ? 0.5 : 1 }}
                          >
                            Mark Shipped
                          </button>
                        </>
                      )}
                      {order.status === 'paid' && isPickup && (
                        <button
                          onClick={() => updateOrder(order.id, { status: 'delivered' })}
                          disabled={updating === order.id}
                          style={{ ...sharedStyles.button, fontSize: 13, padding: '6px 14px' }}
                        >
                          Mark Picked Up
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrder(order.id, { status: 'delivered' })}
                          disabled={updating === order.id}
                          style={{ ...sharedStyles.button, fontSize: 13, padding: '6px 14px' }}
                        >
                          Mark Delivered
                        </button>
                      )}
                      <span style={{ fontSize: 12, color: '#999', marginLeft: 'auto' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
