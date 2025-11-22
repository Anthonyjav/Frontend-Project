'use client';
import { useEffect, useState } from 'react';

export default function PagoExitoso() {
  const [respuesta, setRespuesta] = useState<any>(null);

  useEffect(() => {   
    setRespuesta({orderStatus: 'PAID', orderDetails: {orderTotalAmount: 1200, orderCurrency: 'PEN', orderId: '1'}, customer: {email: 'test@test.com', billingDetails: {firstName: 'Fabio', lastName: 'Vargas'}}, transactions: [{uuid: 'xxxx'}]});
  }, []);

  if (!respuesta) return <p>Procesando datos...</p>;

  const order = respuesta.orderDetails;
  const customer = respuesta.customer.billingDetails;
  const transaction = respuesta.transactions[0];

  return (
    <div>
      <h1>Pago Exitoso</h1>
      <p>Estado: {respuesta.orderStatus}</p>
      <p>Monto: {order.orderCurrency} {order.orderTotalAmount / 100}</p>
      <p>Order ID: {order.orderId}</p>
      <p>Cliente: {customer.firstName} {customer.lastName}</p>
      <p>Email: {respuesta.customer.email}</p>
      <p>Transacción ID: {transaction.uuid}</p>
    </div>
  );
}
