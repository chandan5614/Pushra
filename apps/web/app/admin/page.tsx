import Link from 'next/link'

export default function AdminIndex() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <ul className="list-disc ml-5">
        <li>
          <Link className="underline" href="/admin/orders">
            Orders
          </Link>
        </li>
        <li>
          <Link className="underline" href="/admin/slots">
            Slots
          </Link>
        </li>
      </ul>
    </div>
  )
}
