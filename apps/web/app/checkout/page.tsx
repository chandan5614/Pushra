"use client"
import { useEffect, useState } from 'react'

export default function CheckoutPage() {
  const [status, setStatus] = useState('Waiting for checkout init...')
  useEffect(()=>{
    setStatus('Use cart page to start checkout. This page would render payment UI (Apple Pay or card).')
  },[])
  return <div className="text-gray-700">{status}</div>
}

